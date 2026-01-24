
import React, { useState, useMemo } from 'react';
import type { UploadedFile, EnhancementMode } from '../types';
import { analyzeImage, autopilotImage, assessQuality } from '../services/geminiService';
import { AutopilotIcon, SparklesIcon, ChevronDoubleLeftIcon } from './icons';
import Header from './Header';
import { useTranslation } from '../contexts/LanguageContext';
import { runAutopilot } from '../services/aiAutopilot';

interface BatchViewProps {
  files: UploadedFile[];
  onBatchComplete: (updatedFiles: { id: string; file: File }[]) => void;
  onSetFiles: (updater: (files: UploadedFile[]) => UploadedFile[], actionName: string) => void;
  addNotification: (message: string, type?: 'info' | 'error') => void;
  title: string;
  onOpenApiKeyModal: () => void;
  onToggleSidebar: () => void;
  mode?: 'culling' | 'batch';
}

const BatchView: React.FC<BatchViewProps> = ({ files, onBatchComplete, onSetFiles, addNotification, title, onToggleSidebar, onOpenApiKeyModal, mode = 'batch' }) => {
  const { t, language } = useTranslation();
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set(files.map(f => f.id)));
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [failedFiles, setFailedFiles] = useState<string[]>([]);

  const selectedFiles = useMemo(() => files.filter(f => selectedFileIds.has(f.id)), [files, selectedFileIds]);

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) newSet.delete(fileId);
      else newSet.add(fileId);
      return newSet;
    });
  };

  const handleBatchAutopilot = async () => {
    if (selectedFiles.length === 0) {
      addNotification(t.raw_no_files, 'error');
      return;
    }
    setIsProcessing(true);
    setProgress({ current: 0, total: selectedFiles.length });
    const updatedFiles: { id: string; file: File }[] = [];
    for (const file of selectedFiles) {
      try {
        const { file: newFile } = await autopilotImage(file.file);
        updatedFiles.push({ id: file.id, file: newFile });
      } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (message.includes('API_KEY_MISSING') || message.toLowerCase().includes('api key')) {
          onOpenApiKeyModal();
        }
        addNotification(`${t.batch_error} ${file.file.name}`, 'error');
      } finally {
        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }
    }
    setIsProcessing(false);
    if (updatedFiles.length > 0) {
      onBatchComplete(updatedFiles);
      addNotification(t.batch_complete, 'info');
    }
  };

  const categorizeText = (text: string): EnhancementMode => {
    const normalized = text.toLowerCase();
    if (normalized.includes('portrait') || normalized.includes('person') || normalized.includes('face')) return 'portrait';
    if (normalized.includes('landscape') || normalized.includes('mountain') || normalized.includes('sky') || normalized.includes('nature')) return 'landscape';
    if (normalized.includes('food') || normalized.includes('meal') || normalized.includes('dish')) return 'food';
    if (normalized.includes('product') || normalized.includes('object') || normalized.includes('studio')) return 'product';
    if (normalized.includes('real estate') || normalized.includes('interior') || normalized.includes('architecture')) return 'real-estate';
    return 'auto';
  };

  const handleSmartBatch = async () => {
    if (selectedFiles.length === 0) {
      addNotification(t.raw_no_files, 'error');
      return;
    }
    setIsProcessing(true);
    setProgress({ current: 0, total: selectedFiles.length });
    const updatedFiles: { id: string; file: File }[] = [];
    for (const file of selectedFiles) {
      try {
        const analysis = await analyzeImage(file.file, language);
        const mode = categorizeText(`${analysis.description} ${analysis.suggestions?.join(' ') || ''}`);
        const result = await runAutopilot(file.file, mode);
        if (result.enhancedFile) {
          updatedFiles.push({ id: file.id, file: result.enhancedFile });
          onSetFiles(prev => prev.map(f => f.id === file.id ? { ...f, category: mode } : f), 'Chytrá kategorizace batch');
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (message.includes('API_KEY_MISSING') || message.toLowerCase().includes('api key')) {
          onOpenApiKeyModal();
        }
        addNotification(`${t.batch_error} ${file.file.name}`, 'error');
      } finally {
        setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      }
    }
    setIsProcessing(false);
    if (updatedFiles.length > 0) {
      onBatchComplete(updatedFiles);
      addNotification(t.batch_complete, 'info');
    }
  };

  const handleRunCulling = async () => {
      if (files.length === 0) return;
      setFailedFiles([]);
      setIsProcessing(true);
      setProgress({ current: 0, total: files.length });
      const failures: string[] = [];
      for (const file of files) {
          try {
              const assessment = await assessQuality(file.file);
              onSetFiles(prev => prev.map(f => 
                  f.id === file.id ? { ...f, assessment, isAnalyzing: false } : f
              ), 'Chytrý výběr');
          } catch (e) {
              console.error(`Failed to assess ${file.file.name}:`, e);
              failures.push(file.file.name);
              onSetFiles(prev => prev.map(f => 
                  f.id === file.id ? { ...f, isAnalyzing: false } : f
              ), 'Hodnocení selhalo');
          }
          finally { setProgress(prev => ({ ...prev, current: prev.current + 1 })); }
      }
      setIsProcessing(false);
      setFailedFiles(failures);
      if (failures.length > 0) {
          addNotification(
              `${failures.length} files failed: ${failures.slice(0, 3).join(', ')}${failures.length > 3 ? '...' : ''}`,
              'error'
          );
      } else {
          addNotification(t.msg_success, 'info');
      }
  };

  const selectBestPicks = () => {
      const bestIds = new Set(files.filter(f => f.assessment?.isBestPick).map(f => f.id));
      setSelectedFileIds(bestIds);
  };

  return (
    <div className="w-full h-full flex flex-col bg-void">
      <Header title={mode === 'culling' ? t.pipeline_step_culling : t.nav_batch} onToggleSidebar={onToggleSidebar} onOpenApiKeyModal={onOpenApiKeyModal} />
      <div className="flex-1 w-full flex flex-col items-center p-4 sm:p-8 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-6xl space-y-8 animate-fade-in">
          
          <div className="text-center">
            <h1 className="text-4xl heading tracking-tight">{mode === 'culling' ? t.turbo_culling : t.batch_title}</h1>
            <p className="mt-2 text-text-secondary max-w-xl mx-auto">{mode === 'culling' ? t.turbo_culling_desc : t.batch_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Toolbar Section */}
              <div className="md:col-span-1 space-y-6">
                <div className={`p-6 border transition-none ${mode === 'culling' ? 'bg-surface border-accent border-l-4' : 'bg-surface border-border-subtle'}`}>
                    <SparklesIcon className="w-8 h-8 text-accent mb-4" />
                    <h3 className="font-bold text-text-primary mb-2">{t.turbo_culling}</h3>
                    <p className="text-xs text-text-secondary mb-6 leading-relaxed">AI prozkoumá ostrost a expozici všech fotek.</p>
                    <button onClick={handleRunCulling} disabled={isProcessing} className="w-full py-3 bg-elevated border border-border-subtle text-xs font-black uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-accent transition-none">
                        {t.turbo_run_culling}
                    </button>
                </div>

                <div className={`p-6 border transition-none ${mode === 'batch' ? 'bg-surface border-accent border-l-4' : 'bg-surface border-border-subtle'}`}>
                    <AutopilotIcon className="w-8 h-8 text-accent mb-4" />
                    <h3 className="font-bold text-text-primary mb-2">{t.turbo_express}</h3>
                    <p className="text-xs text-text-secondary mb-6 leading-relaxed">Hromadné vylepšení vybraných snímků.</p>
                    <button onClick={handleBatchAutopilot} disabled={isProcessing || selectedFiles.length === 0} className="w-full py-3 bg-accent text-void border border-accent text-xs font-black uppercase tracking-widest transition-none">
                        {t.turbo_express_btn} ({selectedFiles.length})
                    </button>
                    <button onClick={handleSmartBatch} disabled={isProcessing || selectedFiles.length === 0} className="w-full mt-3 py-3 bg-elevated border border-border-subtle text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-accent transition-none">
                        Chytrý batch (auto kategorizace)
                    </button>
                </div>
              </div>

              {/* Grid Section */}
              <div className="md:col-span-3 bg-surface border border-border-subtle p-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black text-text-primary">{t.batch_select}</h2>
                        <button onClick={selectBestPicks} className="text-[10px] uppercase tracking-widest font-black text-text-secondary bg-elevated px-3 py-1 border border-border-subtle hover:text-text-primary hover:border-accent transition-none">Vybrat AI favority</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map(file => (
                        <div key={file.id} className="relative aspect-square cursor-pointer group" onClick={() => toggleFileSelection(file.id)}>
                            <img src={file.previewUrl} alt={file.file.name} className="w-full h-full object-cover border border-border-subtle" />
                            <div className={`absolute inset-0 border border-border-subtle transition-none ${selectedFileIds.has(file.id) ? 'bg-void/60 border-accent' : 'group-hover:bg-void/60'}`}>
                                {file.assessment && (
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {file.assessment.isBestPick && <div className="bg-accent text-[8px] font-black text-void px-2 py-0.5 border border-accent">TOP</div>}
                                        {file.assessment.score < 40 && <div className="bg-void text-[8px] font-black text-accent px-2 py-0.5 border border-accent">LOW</div>}
                                    </div>
                                )}
                                {file.category && (
                                    <div className="absolute bottom-2 left-2 text-[8px] font-black uppercase tracking-widest text-text-secondary bg-void border border-border-subtle px-2 py-0.5">
                                        {file.category}
                                    </div>
                                )}
                                {selectedFileIds.has(file.id) && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-accent flex items-center justify-center text-void border border-border-subtle">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {isProcessing && (
                  <div className="mt-8 pt-8 border-t border-border-subtle">
                      <div className="flex justify-between mb-3">
                          <span className="text-xs font-black uppercase tracking-widest text-text-secondary">{t.batch_processing}</span>
                          <span className="text-xs font-mono text-accent font-bold">{progress.current} / {progress.total}</span>
                      </div>
                      <div className="w-full bg-elevated h-1.5 overflow-hidden border border-border-subtle">
                          <div className="bg-accent h-full transition-all duration-700" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                      </div>
                  </div>
                )}
              </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default BatchView;
