
import React, { useState, useMemo } from 'react';
import type { UploadedFile } from '../types';
import { autopilotImage, assessQuality } from '../services/geminiService';
import { AutopilotIcon, SparklesIcon, ChevronDoubleLeftIcon } from './icons';
import Header from './Header';
import { useTranslation } from '../contexts/LanguageContext';

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

const BatchView: React.FC<BatchViewProps> = ({ files, onBatchComplete, onSetFiles, addNotification, title, onToggleSidebar, mode = 'batch' }) => {
  const { t } = useTranslation();
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set(files.map(f => f.id)));
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

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
      setIsProcessing(true);
      setProgress({ current: 0, total: files.length });
      for (const file of files) {
          try {
              const assessment = await assessQuality(file.file);
              onSetFiles(curr => curr.map(f => f.id === file.id ? { ...f, assessment } : f), 'Smart Culling');
          } catch (e) { console.error(e); }
          finally { setProgress(prev => ({ ...prev, current: prev.current + 1 })); }
      }
      setIsProcessing(false);
      addNotification(t.msg_success, 'info');
  };

  const selectBestPicks = () => {
      const bestIds = new Set(files.filter(f => f.assessment?.isBestPick).map(f => f.id));
      setSelectedFileIds(bestIds);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      <Header title={mode === 'culling' ? t.pipeline_step_culling : t.nav_batch} onToggleSidebar={onToggleSidebar} />
      <div className="flex-1 w-full flex flex-col items-center p-4 sm:p-8 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-6xl space-y-8 animate-fade-in">
          
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-white">{mode === 'culling' ? t.turbo_culling : t.batch_title}</h1>
            <p className="mt-2 text-slate-500 max-w-xl mx-auto">{mode === 'culling' ? t.turbo_culling_desc : t.batch_subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Toolbar Section */}
              <div className="md:col-span-1 space-y-6">
                <div className={`p-6 rounded-3xl border transition-all ${mode === 'culling' ? 'bg-cyan-500/10 border-cyan-500/20 shadow-2xl' : 'bg-slate-900 border-white/5'}`}>
                    <SparklesIcon className="w-8 h-8 text-cyan-400 mb-4" />
                    <h3 className="font-bold text-slate-200 mb-2">{t.turbo_culling}</h3>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">AI prozkoumá ostrost a expozici všech fotek.</p>
                    <button onClick={handleRunCulling} disabled={isProcessing} className="w-full py-3 bg-slate-800 hover:bg-cyan-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest rounded-xl border border-white/5">
                        {t.turbo_run_culling}
                    </button>
                </div>

                <div className={`p-6 rounded-3xl border transition-all ${mode === 'batch' ? 'bg-fuchsia-500/10 border-fuchsia-500/20 shadow-2xl' : 'bg-slate-900 border-white/5'}`}>
                    <AutopilotIcon className="w-8 h-8 text-fuchsia-400 mb-4" />
                    <h3 className="font-bold text-slate-200 mb-2">{t.turbo_express}</h3>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">Hromadné vylepšení vybraných snímků.</p>
                    <button onClick={handleBatchAutopilot} disabled={isProcessing || selectedFiles.length === 0} className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:scale-105 transition-all text-xs font-black uppercase tracking-widest rounded-xl shadow-lg text-white">
                        {t.turbo_express_btn} ({selectedFiles.length})
                    </button>
                </div>
              </div>

              {/* Grid Section */}
              <div className="md:col-span-3 bg-slate-900/30 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black text-white">{t.batch_select}</h2>
                        <button onClick={selectBestPicks} className="text-[10px] uppercase tracking-widest font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20 hover:bg-cyan-400/20 transition-all">Select AI Picks</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map(file => (
                        <div key={file.id} className="relative aspect-square cursor-pointer group" onClick={() => toggleFileSelection(file.id)}>
                            <img src={file.previewUrl} alt={file.file.name} className="w-full h-full object-cover rounded-2xl" />
                            <div className={`absolute inset-0 rounded-2xl transition-all ${selectedFileIds.has(file.id) ? 'ring-4 ring-cyan-500 bg-black/40' : 'group-hover:bg-black/60'}`}>
                                {file.assessment && (
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {file.assessment.isBestPick && <div className="bg-cyan-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full shadow-lg">TOP</div>}
                                        {file.assessment.score < 40 && <div className="bg-red-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full shadow-lg">LOW</div>}
                                    </div>
                                )}
                                {selectedFileIds.has(file.id) && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white border-2 border-slate-900 shadow-xl">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {isProcessing && (
                  <div className="mt-8 pt-8 border-t border-white/5">
                      <div className="flex justify-between mb-3">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-500">{t.batch_processing}</span>
                          <span className="text-xs font-mono text-cyan-400 font-bold">{progress.current} / {progress.total}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 h-full transition-all duration-700 animate-pulse" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
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
