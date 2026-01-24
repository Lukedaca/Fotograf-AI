
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Header from './Header';
import ManualEditControls from './ManualEditControls';
import Histogram from './Histogram';
import CompareSlider from './CompareSlider';
import { 
    UndoIcon, 
    UploadIcon, 
    AutopilotIcon, 
    SparklesIcon,
    YoutubeIcon,
    MicrophoneIcon,
    HistoryIcon,
    ExportIcon,
    EraserIcon,
    AutoCropIcon
} from './icons';
import type { UploadedFile, EditorAction, History, Preset, ManualEdits, View, AIGalleryType } from '../types';
import * as geminiService from '../services/geminiService';
import { applyEditsAndExport } from '../utils/imageProcessor';
import { getImageDimensionsFromBlob, saveAIGalleryAsset } from '../utils/aiGallery';
import { useTranslation } from '../contexts/LanguageContext';

interface EditorViewProps {
  files: UploadedFile[];
  activeFileId: string | null;
  onSetFiles: (updater: (files: UploadedFile[]) => UploadedFile[], actionName: string) => void;
  onSetActiveFileId: (id: string | null) => void;
  activeAction: EditorAction;
  addNotification: (message: string, type?: 'info' | 'error') => void;
  userPresets: Preset[];
  onPresetsChange: (presets: Preset[]) => void;
  history: History;
  onUndo: () => void;
  onRedo: () => void;
  onNavigate: (payload: { view: View; action?: string }) => void;
  onOpenApiKeyModal: () => void;
  onToggleSidebar: () => void;
  credits: number;
  onDeductCredits: (amount: number) => Promise<boolean>;
  currentProjectId?: string | null;
}

const INITIAL_EDITS: ManualEdits = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  shadows: 0,
  highlights: 0,
  clarity: 0,
  sharpness: 0,
  noiseReduction: 0,
  aspectRatio: undefined,
  cropRect: undefined, 
  watermark: { enabled: false, text: '', opacity: 50, size: 20, position: 'bottom-right', color: '#ffffff' }
};

const EditorView: React.FC<EditorViewProps> = (props) => {
  const { files, activeFileId, onSetFiles, onSetActiveFileId, activeAction, addNotification, language, credits, onDeductCredits, history, onUndo, onRedo, onNavigate, onOpenApiKeyModal, currentProjectId } = props;
  const { t: trans } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [editedPreviewUrl, setEditedPreviewUrl] = useState<string | null>(null);
  const [manualEdits, setManualEdits] = useState<ManualEdits>(INITIAL_EDITS);
  const [exportOptions, setExportOptions] = useState({ format: 'jpeg', quality: 90, scale: 1 });
  const [isComparing, setIsComparing] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const createdUrlsRef = useRef<string[]>([]);
  const createTrackedUrl = useCallback((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      createdUrlsRef.current.push(url);
      return url;
  }, []);
  const revokeTrackedUrl = useCallback((url: string) => {
      URL.revokeObjectURL(url);
      createdUrlsRef.current = createdUrlsRef.current.filter((item) => item !== url);
  }, []);
  
  // YouTube Thumbnail State
  const [thumbnailTopic, setThumbnailTopic] = useState('');
  const [thumbnailText, setThumbnailText] = useState('');
  const [thumbnailResolution, setThumbnailResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [thumbnailFormat, setThumbnailFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);
  const isYouTubeMode = activeAction?.action === 'youtube-thumbnail';

  // Voice Recognition
  useEffect(() => {
      if (!isVoiceActive) return;

      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
          addNotification('Voice recognition not supported in this browser', 'error');
          setIsVoiceActive(false);
          return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = language === 'cs' ? 'cs-CZ' : 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
          if (!event.results || event.results.length === 0) return;
          const last = event.results.length - 1;
          const result = event.results[last];
          if (!result || !result[0]) return;

          const command = result[0].transcript.toLowerCase().trim();
          if (!command) return;

          if (command.includes('jas') || command.includes('brightness')) {
              if (command.includes('víc') || command.includes('up')) {
                  setManualEdits(prev => ({...prev, brightness: Math.min(100, prev.brightness + 10)}));
              } else if (command.includes('méně') || command.includes('down')) {
                   setManualEdits(prev => ({...prev, brightness: Math.max(-100, prev.brightness - 10)}));
              }
          } else if (command.includes('reset')) {
              setManualEdits(INITIAL_EDITS);
          }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          const errorMessages: Record<string, string> = {
              'no-speech': 'No speech detected - try speaking louder',
              'audio-capture': 'Microphone not available',
              'not-allowed': 'Microphone permission denied',
              'network': 'Network error - check connection',
          };
          const message = errorMessages[event.error] || `Voice error: ${event.error}`;
          addNotification(message, 'error');
          if (event.error === 'not-allowed' || event.error === 'audio-capture') {
              setIsVoiceActive(false);
          }
      };

      recognition.onend = () => {
          if (isVoiceActive) {
              try {
                  recognition.start();
              } catch (e) {
                  // already started
              }
          }
      };

      try {
          recognition.start();
      } catch (e) {
          addNotification('Failed to start voice recognition', 'error');
          setIsVoiceActive(false);
      }

      return () => {
          try {
              recognition.stop();
          } catch (e) {
              // already stopped
          }
      };
  }, [isVoiceActive, language, addNotification]);

  useEffect(() => {
      return () => {
          createdUrlsRef.current.forEach((url) => {
              URL.revokeObjectURL(url);
          });
          createdUrlsRef.current = [];
      };
  }, []);

  useEffect(() => {
      return () => {
          if (editedPreviewUrl && editedPreviewUrl.startsWith('blob:')) {
              URL.revokeObjectURL(editedPreviewUrl);
          }
      };
  }, [editedPreviewUrl]);

  useEffect(() => {
    if (!activeFile) return;

    const currentFileId = activeFile.id;
    const currentUrl = activeFile.originalPreviewUrl;
    let isCancelled = false;

    const apply = async () => {
        try {
            const blob = await applyEditsAndExport(
                currentUrl,
                manualEdits,
                { format: 'jpeg', quality: 90, scale: 0.5 }
            );
            if (isCancelled) return;
            const stillExists = files.find(f => f.id === currentFileId);
            if (!stillExists) return;
            const url = createTrackedUrl(blob);
            setEditedPreviewUrl(url);
        } catch (e) {
            if (!isCancelled) {
                console.error('Preview generation failed:', e);
            }
        }
    };

    const t = setTimeout(apply, 150);
    return () => {
        isCancelled = true;
        clearTimeout(t);
    };
  }, [activeFile?.id, activeFile?.originalPreviewUrl, manualEdits, files, createTrackedUrl]);

  const handleAutopilot = async () => {
    if (!activeFile) return;
    const COST = 3;
    if (!await onDeductCredits(COST)) return;

    setIsLoading(true);
    setLoadingMessage("AI analyzuje a vylepšuje váš snímek...");
    try {
        const { file: newFile } = await geminiService.autopilotImage(activeFile.file);
        const url = createTrackedUrl(newFile);
        onSetFiles(current => current.map(f => f.id === activeFileId ? { ...f, file: newFile, previewUrl: url } : f), 'AI Autopilot');
        try {
            const { width, height } = await getImageDimensionsFromBlob(newFile);
            await saveAIGalleryAsset({
                id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                createdAt: new Date().toISOString(),
                type: 'autopilot' as AIGalleryType,
                prompt: 'Autopilot',
                sourceFileId: activeFile.id,
                projectId: currentProjectId || null,
                fileName: newFile.name,
                mimeType: newFile.type,
                size: newFile.size,
                width,
                height,
                blob: newFile,
            });
        } catch (e) {
            console.error('Failed to save AI gallery item', e);
        }
        addNotification(trans.msg_success, 'info');
    } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (message.includes('API_KEY_MISSING') || message.toLowerCase().includes('api key')) {
            onOpenApiKeyModal();
        }
        addNotification(trans.msg_error, 'error');
    }
    finally { setIsLoading(false); }
  };

  const handleManualExport = async () => {
    if (!activeFile) return;
    setIsLoading(true);
    try {
        const blob = await applyEditsAndExport(activeFile.originalPreviewUrl, manualEdits, exportOptions);
        const url = createTrackedUrl(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `edited_${activeFile.file.name.replace(/\.[^/.]+$/, "")}.${exportOptions.format === 'jpeg' ? 'jpg' : 'png'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        revokeTrackedUrl(url);
        addNotification(trans.msg_success, 'info');
    } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (message.includes('API_KEY_MISSING') || message.toLowerCase().includes('api key')) {
            onOpenApiKeyModal();
        }
        addNotification(trans.msg_error, 'error');
    }
    finally { setIsLoading(false); }
  };

  const handleGenerateThumbnail = async () => {
    if (!thumbnailTopic.trim()) { addNotification(trans.tool_youtube_topic_ph, 'error'); return; }
    const COST = 10;
    if (!await onDeductCredits(COST)) return;
    setIsLoading(true);
    setLoadingMessage("Gemini 3 Pro navrhuje virální miniaturu...");
    try {
        const { file } = await geminiService.generateYouTubeThumbnail(thumbnailTopic, thumbnailText, { resolution: thumbnailResolution, format: thumbnailFormat });
        const previewUrl = createTrackedUrl(file);
        const newUploadedFile: UploadedFile = { id: `yt-${Date.now()}`, file, previewUrl, originalPreviewUrl: previewUrl };
        onSetFiles(prev => [...prev, newUploadedFile], 'YouTube Thumbnail Creation');
        onSetActiveFileId(newUploadedFile.id);
        try {
            const { width, height } = await getImageDimensionsFromBlob(file);
            await saveAIGalleryAsset({
                id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                createdAt: new Date().toISOString(),
                type: 'youtube-thumbnail' as AIGalleryType,
                prompt: `Topic: ${thumbnailTopic}\nText: ${thumbnailText}`,
                projectId: currentProjectId || null,
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                width,
                height,
                blob: file,
            });
        } catch (e) {
            console.error('Failed to save AI gallery item', e);
        }
        addNotification(trans.msg_success, 'info');
    } catch (e) { addNotification(trans.msg_error, 'error'); }
    finally { setIsLoading(false); }
  };

  if (!activeFile && !isYouTubeMode) {
    return (
      <div className="flex-1 flex flex-col h-full bg-slate-950">
         <Header title={trans.app_title} onToggleSidebar={props.onToggleSidebar} credits={credits} />
         <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <div className="p-6 bg-slate-900 rounded-3xl mb-6 border border-slate-800">
                <UploadIcon className="w-16 h-16 opacity-30" />
            </div>
            <p className="text-xl font-bold text-slate-300">{trans.editor_no_image}</p>
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
        <Header title={isYouTubeMode ? "YouTube Thumbnail Studio" : trans.nav_studio} onToggleSidebar={props.onToggleSidebar} credits={credits} onBuyCredits={props.onBuyCredits} />
        
        {/* Quick Start Ribbon */}
        {!isYouTubeMode && activeFile && (
          <div className="bg-slate-900/40 border-b border-white/5 py-2 px-8 flex items-center gap-4 overflow-x-auto custom-scrollbar">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 mr-2">Quick Actions:</span>
            <button onClick={handleAutopilot} className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/20 transition-all text-[11px] font-bold">
              <AutopilotIcon className="w-3.5 h-3.5" />
              Base Edit
            </button>
            <button onClick={() => onNavigate({ view: 'editor', action: 'retouch' })} className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 rounded-full border border-fuchsia-500/20 transition-all text-[11px] font-bold">
              <EraserIcon className="w-3.5 h-3.5" />
              Retouch
            </button>
            <button onClick={() => onNavigate({ view: 'editor', action: 'auto-crop' })} className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/20 transition-all text-[11px] font-bold">
              <AutoCropIcon className="w-3.5 h-3.5" />
              Auto Crop
            </button>
            <button onClick={() => onNavigate({ view: 'editor', action: 'export' })} className="ml-auto flex-shrink-0 flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-white/5 transition-all text-[11px] font-bold">
              <ExportIcon className="w-3.5 h-3.5" />
              Quick Export
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            {/* Viewport */}
            <div className="flex-1 bg-slate-900/40 relative overflow-hidden flex items-center justify-center p-4">
                <div className="w-full max-w-4xl h-full relative flex items-center justify-center">
                    
                    {!isYouTubeMode && activeFile && (
                        <button onClick={() => setIsVoiceActive(!isVoiceActive)} className={`absolute top-4 left-4 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 ${isVoiceActive ? 'bg-red-500 animate-pulse text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                            <MicrophoneIcon className="w-6 h-6" />
                        </button>
                    )}

                    {activeFile ? (
                        <div className="relative group shadow-2xl rounded-xl overflow-hidden border border-white/10 max-h-full max-w-full">
                           {isComparing ? (
                               <CompareSlider beforeUrl={activeFile.originalPreviewUrl} afterUrl={editedPreviewUrl || activeFile.previewUrl} />
                           ) : (
                               <>
                                <img src={editedPreviewUrl || activeFile.previewUrl} alt="Preview" className="max-h-full max-w-full object-contain select-none" />
                                <button onMouseDown={() => setIsComparing(true)} onMouseUp={() => setIsComparing(false)} className="absolute bottom-4 right-4 bg-slate-900/80 text-white px-4 py-2 rounded-full text-xs font-bold border border-white/10 hover:bg-black transition-colors z-20">
                                    {trans.compare_btn}
                                </button>
                               </>
                           )}
                        </div>
                    ) : isYouTubeMode ? (
                        <div className="w-full h-full border-2 border-dashed border-red-500/20 rounded-3xl flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm group">
                            <div className="p-8 bg-red-500/5 rounded-full mb-6 group-hover:bg-red-500/10 transition-all duration-500">
                                <YoutubeIcon className="w-20 h-20 text-red-600 opacity-20" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-600 tracking-tighter uppercase">Thumbnail Designer</h2>
                        </div>
                    ) : null}
                </div>
                
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
                        <p className="text-xl font-black text-white tracking-tight animate-pulse">{loadingMessage}</p>
                    </div>
                )}
            </div>

            {/* Controls Sidebar */}
            <div className="w-full lg:w-96 bg-slate-900/90 backdrop-blur-3xl border-l border-white/5 flex flex-col z-20 overflow-y-auto custom-scrollbar">
                
                {/* Job Log (Recent History) */}
                <div className="px-8 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Job Log</h4>
                    <div className="flex gap-2">
                      <button onClick={onUndo} disabled={history.past.length === 0} className="p-1.5 bg-slate-800 rounded-md text-slate-400 hover:text-white disabled:opacity-30"><UndoIcon className="w-3 h-3" /></button>
                      <button onClick={onRedo} disabled={history.future.length === 0} className="p-1.5 bg-slate-800 rounded-md text-slate-400 hover:text-white disabled:opacity-30"><UndoIcon className="w-3 h-3 rotate-180" /></button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto mb-6">
                    {history.past.slice(-3).map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] text-slate-600">
                        <HistoryIcon className="w-3 h-3" />
                        <span>{h.actionName}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-bold">
                        <SparklesIcon className="w-3 h-3" />
                        <span>{history.present.actionName}</span>
                    </div>
                  </div>
                </div>

                {!isYouTubeMode && activeFile && (
                    <div className="px-8">
                        <Histogram imageUrl={editedPreviewUrl || activeFile.previewUrl} />
                    </div>
                )}

                <div className="p-8 space-y-8 pt-2">
                    {isYouTubeMode && (
                        <div className="space-y-6 animate-fade-in-right">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{trans.tool_youtube_topic}</label>
                                <textarea rows={3} value={thumbnailTopic} onChange={(e) => setThumbnailTopic(e.target.value)} placeholder={trans.tool_youtube_topic_ph} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:ring-2 focus:ring-red-600 outline-none transition-all placeholder:text-slate-700 shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{trans.tool_youtube_text}</label>
                                <input type="text" value={thumbnailText} onChange={(e) => setThumbnailText(e.target.value)} placeholder={trans.tool_youtube_text_ph} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:ring-2 focus:ring-red-600 outline-none transition-all placeholder:text-slate-700 shadow-inner" />
                            </div>
                             <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>{trans.credits_cost}:</span>
                                <span className="font-bold text-amber-400">10 {trans.credits_remaining}</span>
                             </div>
                             <button onClick={handleGenerateThumbnail} disabled={isLoading} className="w-full py-5 bg-red-600 hover:bg-red-500 rounded-2xl text-sm font-black text-white shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                <SparklesIcon className="w-5 h-5" />
                                {trans.tool_youtube_btn}
                            </button>
                        </div>
                    )}

                    {!isYouTubeMode && activeFile && (
                         <ManualEditControls edits={manualEdits} onEditChange={(k, v) => setManualEdits(p => ({...p, [k]: v}))} onReset={() => setManualEdits(INITIAL_EDITS)} exportOptions={exportOptions} onExportOptionsChange={setExportOptions} onRequestExport={handleManualExport} onStartManualCrop={() => {}} onSnapshot={() => {}} />
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default EditorView;
