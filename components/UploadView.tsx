
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, ArrowPathIcon } from './icons';
import Header from './Header';
import { isRawFile, processRawFile, RAW_EXTENSIONS_STRING } from '../utils/rawProcessor';
import { useTranslation } from '../contexts/LanguageContext';

interface UploadViewProps {
  onFilesSelected: (files: File[]) => void;
  projectName?: string;
  // Props for the Header
  title: string;
  onOpenApiKeyModal: () => void;
  onToggleSidebar: () => void;
  addNotification?: (message: string, type: 'info' | 'error') => void;
}

const UploadView: React.FC<UploadViewProps> = ({ 
  onFilesSelected, 
  projectName,
  title, 
  onOpenApiKeyModal,
  onToggleSidebar,
  addNotification
}) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFiles = async (incomingFiles: File[]) => {
      setIsProcessing(true);
      const finalFiles: File[] = [];
      let rawCount = 0;

      for (let i = 0; i < incomingFiles.length; i++) {
          const file = incomingFiles[i];
          if (isRawFile(file)) {
              rawCount++;
              setProcessingStatus(`RAW: ${file.name} (${rawCount}...)`);
              try {
                  const convertedFile = await processRawFile(file);
                  finalFiles.push(convertedFile);
              } catch (error) {
                  console.error(`Failed to convert ${file.name}`, error);
                  if (addNotification) addNotification(`${t.msg_error}: ${file.name}`, 'error');
              }
          } else {
              finalFiles.push(file);
          }
      }

      setIsProcessing(false);
      setProcessingStatus('');
      
      if (finalFiles.length > 0) {
          onFilesSelected(finalFiles);
      }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = Array.from(e.dataTransfer.files);
      processFiles(files);
      e.dataTransfer.clearData();
    }
  }, [onFilesSelected, addNotification]);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      processFiles(files);
    }
  };
  
  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full h-full flex flex-col bg-void text-text-primary">
       <Header 
        title={title} 
        onOpenApiKeyModal={onOpenApiKeyModal}
        onToggleSidebar={onToggleSidebar}
      />
      <div className="flex-1 w-full flex items-center justify-center p-4 sm:p-8">
        {isProcessing ? (
            <div className="flex flex-col items-center justify-center text-text-secondary animate-fade-in">
                 <div className="w-16 h-16 mb-6 relative">
                    <div className="absolute inset-0 border-4 border-border-subtle"></div>
                    <div className="absolute inset-0 border-4 border-t-accent border-r-accent border-b-transparent border-l-transparent animate-spin"></div>
                 </div>
                 <h3 className="text-2xl font-bold text-text-primary mb-2">{t.upload_processing}</h3>
                 <p>{processingStatus}</p>
            </div>
        ) : (
            <div 
            className={`w-full max-w-4xl flex flex-col items-center justify-center p-12 border transition-none relative ${isDragging ? 'border-accent bg-surface' : 'border-border-subtle bg-surface'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            >
              <div className="text-center">
                {projectName && (
                  <div className="mb-6 text-xs uppercase tracking-[0.2em] text-text-secondary">
                    {t.crm_uploading_to} <span className="text-text-primary">{projectName}</span>
                  </div>
                )}
                <UploadIcon className="mx-auto h-16 w-16 text-text-secondary mb-6" />
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-text-primary">
                  {t.upload_drag}
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  {t.upload_support} <strong>RAW (CR2, NEF, ARW...)</strong>
                </p>
                <div className="mt-8">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={`image/jpeg,image/png,image/webp,${RAW_EXTENSIONS_STRING}`}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={onButtonClick}
                    className="inline-flex items-center px-8 py-3 border border-accent text-sm font-semibold text-void bg-accent transition-none"
                  >
                    <UploadIcon className="-ml-1 mr-3 h-5 w-5" />
                    {t.upload_btn}
                  </button>
                </div>
                <p className="mt-8 text-xs text-text-secondary">
                  {t.upload_raw}
                </p>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default UploadView;
