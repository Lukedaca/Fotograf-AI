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
              setProcessingStatus(`Konverze RAW: ${file.name} (${rawCount}...)`);
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
            <div className="flex flex-col items-center justify-center text-text-secondary animate-fade-in glass-panel p-12 rounded-3xl">
                 <div className="w-16 h-16 mb-6 relative">
                    <div className="absolute inset-0 border-4 border-[#ffffff10] rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">{t.upload_processing}</h3>
                 <p className="text-gray-400 font-mono text-xs">{processingStatus}</p>
            </div>
        ) : (
            <div 
            className={`
                w-full max-w-4xl flex flex-col items-center justify-center p-16 
                border-2 border-dashed rounded-3xl transition-all duration-300 relative overflow-hidden group
                ${isDragging 
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_50px_rgba(99,102,241,0.2)] scale-[1.02]' 
                    : 'border-[#ffffff15] bg-[#ffffff02] hover:border-[#ffffff30] hover:bg-[#ffffff05]'}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            >
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500 rounded-full blur-[120px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none"></div>

              <div className="text-center relative z-10">
                {projectName && (
                  <div className="mb-6 inline-flex items-center px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                    Project: {projectName}
                  </div>
                )}
                
                <div className={`mx-auto h-20 w-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${isDragging ? 'bg-indigo-500 text-white shadow-lg rotate-3 scale-110' : 'bg-[#ffffff08] text-gray-400 group-hover:text-white group-hover:scale-110 group-hover:bg-[#ffffff10]'}`}>
                    <UploadIcon className="h-10 w-10" />
                </div>

                <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-white mb-2">
                  {t.upload_drag}
                </h3>
                <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                  Podporujeme <strong>JPG, PNG, WEBP</strong> a profesionální <strong>RAW</strong> formáty (CR2, NEF, ARW) s automatickou konverzí.
                </p>
                
                <div className="mt-10">
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
                    className="inline-flex items-center px-8 py-4 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105"
                  >
                    <UploadIcon className="-ml-1 mr-3 h-5 w-5" />
                    Vybrat soubory
                  </button>
                </div>
                
                <p className="mt-8 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                  Maximum file size: 50MB
                </p>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default UploadView;