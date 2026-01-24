
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './Header';
import FloatingDock from './editor/FloatingDock';
import RadialMenu from './editor/RadialMenu';
import CinematicLoader from './common/CinematicLoader';
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
    AutoCropIcon,
    BackgroundReplacementIcon
} from './icons';
import type { UploadedFile, EditorAction, History, Preset, ManualEdits, View, AIGalleryType, AutoCropSuggestion, QualityAssessment } from '../types';
import * as geminiService from '../services/geminiService';
import { applyEditsAndExport } from '../utils/imageProcessor';
import { getImageDimensionsFromBlob, saveAIGalleryAsset } from '../utils/aiGallery';
import { useTranslation } from '../contexts/LanguageContext';
import { updateUserTendencies } from '../services/userProfileService';

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
  const { files, activeFileId, onSetFiles, onSetActiveFileId, activeAction, addNotification, credits, onDeductCredits, history, onUndo, onRedo, onNavigate, onOpenApiKeyModal, currentProjectId } = props;
  const { t: trans, language } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [editedPreviewUrl, setEditedPreviewUrl] = useState<string | null>(null);
  const [manualEdits, setManualEdits] = useState<ManualEdits>(INITIAL_EDITS);
  const [exportOptions, setExportOptions] = useState({ format: 'jpeg', quality: 90, scale: 1 });
  const [isComparing, setIsComparing] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [autoCropSuggestions, setAutoCropSuggestions] = useState<AutoCropSuggestion[]>([]);
  const [autoCropSelectedIndex, setAutoCropSelectedIndex] = useState(0);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const [qualityAssessment, setQualityAssessment] = useState<QualityAssessment | null>(null);
  const [showBgModal, setShowBgModal] = useState(false);
  const [bgPrompt, setBgPrompt] = useState('');
  const [autoCropImageSize, setAutoCropImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [radialMenu, setRadialMenu] = useState<{ x: number; y: number } | null>(null);
  const lastAutoCropAtRef = useRef<number | null>(null);
  const cropRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

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
    setQualityAssessment(activeFile.assessment || null);

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

  const handleBackgroundRemoval = async () => {
    if (!activeFile) return;
    const COST = 4;
    if (!await onDeductCredits(COST)) return;

    setIsLoading(true);
    setLoadingMessage("Odstraňuji pozadí...");
    try {
        const { file: newFile } = await geminiService.removeBackground(activeFile.file);
        const url = createTrackedUrl(newFile);
        onSetFiles(current => current.map(f => f.id === activeFileId ? { ...f, file: newFile, previewUrl: url } : f), 'Background Removal');
        addNotification(trans.msg_success, 'info');
    } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (message.includes('API_KEY_MISSING') || message.toLowerCase().includes('api key')) {
            onOpenApiKeyModal();
        }
        addNotification(trans.msg_error, 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleBackgroundReplace = async () => {
    if (!activeFile) return;
    if (!bgPrompt.trim()) return;
    const COST = 5;
    if (!await onDeductCredits(COST)) return;
    setIsLoading(true);
    setLoadingMessage("Nahrazuji pozadí...");
    try {
        const { file: newFile } = await geminiService.replaceBackground(activeFile.file, bgPrompt.trim());
        const url = createTrackedUrl(newFile);
        onSetFiles(current => current.map(f => f.id === activeFileId ? { ...f, file: newFile, previewUrl: url } : f), 'Výměna pozadí');
        setBgPrompt('');
        setShowBgModal(false);
        addNotification(trans.msg_success, 'info');
    } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (message.includes('API_KEY_MISSING') || message.toLowerCase().includes('api key')) {
            onOpenApiKeyModal();
        }
        addNotification(trans.msg_error, 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleFaceEnhance = async () => {
    if (!activeFile) return;
    const COST = 3;
    if (!await onDeductCredits(COST)) return;
    setIsLoading(true);
    setLoadingMessage("Vylepšuji obličeje...");
    try {
        const { file: newFile } = await geminiService.enhanceFaces(activeFile.file);
        const url = createTrackedUrl(newFile);
        onSetFiles(current => current.map(f => f.id === activeFileId ? { ...f, file: newFile, previewUrl: url } : f), 'Face Enhancement');
        addNotification(trans.msg_success, 'info');
    } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (message.includes('API_KEY_MISSING') || message.toLowerCase().includes('api key')) {
            onOpenApiKeyModal();
        }
        addNotification(trans.msg_error, 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleScorePhoto = async () => {
    if (!activeFile) return;
    const COST = 2;
    if (!await onDeductCredits(COST)) return;
    setIsLoading(true);
    setLoadingMessage("Hodnotím kvalitu...");
    try {
        const result = await geminiService.assessQuality(activeFile.file);
        setQualityAssessment(result);
        onSetFiles(current => current.map(f => f.id === activeFileId ? { ...f, assessment: result } : f), 'Photo Scoring');
        addNotification(trans.msg_success, 'info');
    } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (message.includes('API_KEY_MISSING') || message.toLowerCase().includes('api key')) {
            onOpenApiKeyModal();
        }
        addNotification(trans.msg_error, 'error');
    } finally {
        setIsLoading(false);
    }
  };

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

  const handleAutoCrop = useCallback(async () => {
    if (!activeFile) return;
    const COST = 2;
    if (!await onDeductCredits(COST)) return;

    setIsLoading(true);
    setLoadingMessage("AI hledá nejlepší ořez...");
    try {
        const { width, height } = await getImageDimensionsFromBlob(activeFile.file);
        const result = await geminiService.analyzeForAutoCrop(activeFile.file, { width, height });
        const best = result.suggestedCrops[0];
        if (!best?.rect) {
            throw new Error('Auto-crop analysis returned no suggestions');
        }
        setAutoCropSuggestions(result.suggestedCrops);
        setAutoCropSelectedIndex(0);
        setAutoCropImageSize({ width, height });
        setManualEdits(prev => ({
            ...prev,
            cropRect: best.rect,
            aspectRatio: undefined
        }));
        addNotification('Auto-ořez připraven (1–3)', 'info');
    } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (message.includes('API_KEY_MISSING') || message.toLowerCase().includes('api key')) {
            onOpenApiKeyModal();
        }
        addNotification(trans.msg_error, 'error');
    } finally {
        setIsLoading(false);
    }
  }, [activeFile, addNotification, onDeductCredits, onOpenApiKeyModal, trans.msg_error]);

  const handleManualExport = async () => {
    if (!activeFile) return;
    setIsLoading(true);
    try {
        const blob = await applyEditsAndExport(activeFile.originalPreviewUrl, manualEdits, exportOptions);
        const url = createTrackedUrl(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `edited_${activeFile.file.name.replace(/.[^/.]+$/, "")}.${exportOptions.format === 'jpeg' ? 'jpg' : 'png'}`;
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

  const handleSnapshot = () => {
    updateUserTendencies({
      brightness: manualEdits.brightness,
      contrast: manualEdits.contrast,
      saturation: manualEdits.saturation,
      vibrance: manualEdits.vibrance,
      shadows: manualEdits.shadows,
      highlights: manualEdits.highlights,
      clarity: manualEdits.clarity,
      sharpness: manualEdits.sharpness,
      noiseReduction: manualEdits.noiseReduction,
    });
  };

  useEffect(() => {
    if (activeAction?.action !== 'auto-crop') return;
    if (activeAction.timestamp === lastAutoCropAtRef.current) return;
    lastAutoCropAtRef.current = activeAction.timestamp;
    handleAutoCrop();
  }, [activeAction?.action, activeAction?.timestamp, handleAutoCrop]);

  const handleSmartSelect = async () => {
    if (!activeFile) return;
    const COST = 2;
    if (!await onDeductCredits(COST)) return;
    setIsLoading(true);
    setLoadingMessage("Vybírám hlavní objekt...");
    try {
        const { width, height } = await getImageDimensionsFromBlob(activeFile.file);
        const result = await geminiService.analyzeForAutoCrop(activeFile.file, { width, height });
        if (!result.mainSubject) {
            throw new Error('No subject found');
        }
        setManualEdits(prev => ({
            ...prev,
            cropRect: result.mainSubject,
            aspectRatio: undefined
        }));
        addNotification('Objekt vybrán', 'info');
    } catch (e) {
        const message = e instanceof Error ? e.message : '';
        if (message.includes('API_KEY_MISSING') || message.toLowerCase().includes('api key')) {
            onOpenApiKeyModal();
        }
        addNotification(trans.msg_error, 'error');
    } finally {
        setIsLoading(false);
    }
  };

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

          if (command.includes('hey foto') || command.includes('hej foto') || command.includes('hey photo')) {
              addNotification('Hey Foto ready', 'info');
          }

          if (command.includes('jas') || command.includes('brightness')) {
              if (command.includes('víc') || command.includes('up')) {
                  setManualEdits(prev => ({...prev, brightness: Math.min(100, prev.brightness + 10)}));
              } else if (command.includes('méně') || command.includes('down')) {
                   setManualEdits(prev => ({...prev, brightness: Math.max(-100, prev.brightness - 10)}));
              }
          } else if (command.includes('auto crop') || command.includes('ořez') || command.includes('crop')) {
              handleAutoCrop();
          } else if (command.includes('remove background') || command.includes('remove bg') || command.includes('odstraň pozad')) {
              handleBackgroundRemoval();
          } else if (command.includes('replace background') || command.includes('vyměnit pozad')) {
              setShowBgModal(true);
          } else if (command.includes('face') || command.includes('obličej')) {
              handleFaceEnhance();
          } else if (command.includes('score') || command.includes('hodno')) {
              handleScorePhoto();
          } else if (command.includes('compare') || command.includes('porov')) {
              setIsComparing(prev => !prev);
          } else if (command.includes('export') || command.includes('stáhn')) {
              handleManualExport();
          } else if (command.includes('focus')) {
              setIsFocusMode(true);
          } else if (command.includes('exit focus') || command.includes('zruš focus') || command.includes('zpět')) {
              setIsFocusMode(false);
          } else if (command.includes('undo last 3') || command.includes('vrať poslední 3')) {
              onUndo(); onUndo(); onUndo();
          } else if (command.includes('undo') || command.includes('zpět')) {
              onUndo();
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
  }, [isVoiceActive, language, addNotification, handleAutoCrop, handleBackgroundRemoval, handleFaceEnhance, handleManualExport, handleScorePhoto, onUndo]);

  useEffect(() => {
    const suggestions: string[] = [];
    if (manualEdits.brightness > 25 && manualEdits.highlights < 10) {
      suggestions.push('Zkuste snížit světla pro zachování detailů.');
    }
    if (manualEdits.brightness < -20 && manualEdits.shadows < 10) {
      suggestions.push('Zvedněte stíny pro více detailů.');
    }
    if (manualEdits.saturation > 35 && manualEdits.vibrance < 10) {
      suggestions.push('Zvyšte vibrance pro přirozenější sytost.');
    }
    if (manualEdits.sharpness > 60 && manualEdits.noiseReduction < 10) {
      suggestions.push('Přidejte lehkou redukci šumu pro čistší obraz.');
    }
    if (manualEdits.contrast < -20) {
      suggestions.push('Zvyšte kontrast pro lepší dynamiku.');
    }
    if (manualEdits.cropRect && !manualEdits.aspectRatio) {
      suggestions.push('Rychlý tip: zvažte export do 4:3 nebo 3:2.');
    }
    setLiveSuggestions(suggestions.slice(0, 3));
  }, [manualEdits]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFocusMode(false);
        setRadialMenu(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (autoCropSuggestions.length === 0) return;
    const handleKey = (event: KeyboardEvent) => {
        if (event.key === '1' || event.key === '2' || event.key === '3') {
            const idx = Number(event.key) - 1;
            const suggestion = autoCropSuggestions[idx];
            if (!suggestion) return;
            setAutoCropSelectedIndex(idx);
            setManualEdits(prev => ({
                ...prev,
                cropRect: suggestion.rect,
                aspectRatio: undefined
            }));
        }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [autoCropSuggestions]);

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
                prompt: `Topic: ${thumbnailTopic}
Text: ${thumbnailText}`,
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
      <div className="flex-1 flex flex-col h-full bg-void">
         <Header title={trans.app_title} onToggleSidebar={props.onToggleSidebar} credits={credits} />
         <div className="flex-1 flex flex-col items-center justify-center text-text-secondary p-8 text-center">
            <div className="p-6 bg-surface mb-6 border border-border-subtle">
                <UploadIcon className="w-16 h-16 opacity-30" />
            </div>
            <p className="text-xl font-bold text-text-primary">{trans.editor_no_image}</p>
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-void overflow-hidden">
        {!isFocusMode && (
          <Header title={isYouTubeMode ? "YouTube Studio" : trans.nav_studio} onToggleSidebar={props.onToggleSidebar} credits={credits} onBuyCredits={props.onBuyCredits} />
        )}
        
        {/* Quick Start Ribbon */}
        {!isFocusMode && !isYouTubeMode && activeFile && (
          <div className="bg-void border-b border-border-subtle py-2 px-8 flex items-center gap-4 overflow-x-auto custom-scrollbar">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary mr-2">Rychlé akce:</span>
            <button onClick={handleAutopilot} className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-accent transition-none text-[11px] font-bold uppercase tracking-widest">
              <AutopilotIcon className="w-3.5 h-3.5" />
              Základní úprava
            </button>
            <button onClick={() => onNavigate({ view: 'editor', action: 'retouch' })} className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-accent transition-none text-[11px] font-bold uppercase tracking-widest">
              <EraserIcon className="w-3.5 h-3.5" />
              Retuš
            </button>
            <button onClick={() => onNavigate({ view: 'editor', action: 'auto-crop' })} className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-accent transition-none text-[11px] font-bold uppercase tracking-widest">
              <AutoCropIcon className="w-3.5 h-3.5" />
              Auto‑ořez
            </button>
            <button onClick={handleBackgroundRemoval} className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-accent transition-none text-[11px] font-bold uppercase tracking-widest">
              <BackgroundReplacementIcon className="w-3.5 h-3.5" />
              Odstranit pozadí
            </button>
            <button onClick={() => setShowBgModal(true)} className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-accent transition-none text-[11px] font-bold uppercase tracking-widest">
              <BackgroundReplacementIcon className="w-3.5 h-3.5" />
              Vyměnit pozadí
            </button>
            <button onClick={handleSmartSelect} className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-accent transition-none text-[11px] font-bold uppercase tracking-widest">
              <SparklesIcon className="w-3.5 h-3.5" />
              Vybrat subjekt
            </button>
            <button onClick={handleFaceEnhance} className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-accent transition-none text-[11px] font-bold uppercase tracking-widest">
              <SparklesIcon className="w-3.5 h-3.5" />
              Vylepšit obličej
            </button>
            <button onClick={handleScorePhoto} className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-accent transition-none text-[11px] font-bold uppercase tracking-widest">
              <SparklesIcon className="w-3.5 h-3.5" />
              Skóre
            </button>
            <button onClick={() => onNavigate({ view: 'editor', action: 'export' })} className="ml-auto flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-accent transition-none text-[11px] font-bold uppercase tracking-widest">
              <ExportIcon className="w-3.5 h-3.5" />
              Rychlý export
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            {/* Viewport */}
            <div
              className="flex-1 bg-surface/60 relative overflow-hidden flex items-center justify-center p-6"
              onContextMenu={(e) => {
                e.preventDefault();
                if (isYouTubeMode || !activeFile) return;
                setRadialMenu({ x: e.clientX, y: e.clientY });
              }}
            >
                <div className="w-full max-w-5xl h-full relative flex items-center justify-center">
                    
                    {!isYouTubeMode && activeFile && (
                        <button onClick={() => setIsVoiceActive(!isVoiceActive)} className={`absolute top-4 left-4 z-50 p-3 border border-border-subtle transition-none ${isVoiceActive ? 'bg-accent text-void' : 'bg-elevated text-text-secondary hover:text-text-primary'}`}>
                            <MicrophoneIcon className="w-6 h-6" />
                        </button>
                    )}

                    {activeFile ? (
                        <div
                          className="relative group border border-border-subtle overflow-hidden max-h-full max-w-full"
                          onDoubleClick={() => setIsFocusMode((prev) => !prev)}
                        >
                           {isComparing ? (
                               <CompareSlider beforeUrl={activeFile.originalPreviewUrl} afterUrl={editedPreviewUrl || activeFile.previewUrl} />
                           ) : (
                               <>
                                <div className="relative inline-block">
                                  <img src={editedPreviewUrl || activeFile.previewUrl} alt="Náhled" className="block max-h-full max-w-full object-contain select-none" />
                                  {autoCropSuggestions.length > 0 && autoCropImageSize && (
                                    <div className="absolute inset-0 pointer-events-none">
                                      {autoCropSuggestions.slice(0, 3).map((item, idx) => {
                                        const left = (item.rect.x / autoCropImageSize.width) * 100;
                                        const top = (item.rect.y / autoCropImageSize.height) * 100;
                                        const width = (item.rect.width / autoCropImageSize.width) * 100;
                                        const height = (item.rect.height / autoCropImageSize.height) * 100;
                                        const isActive = idx === autoCropSelectedIndex;
                                        return (
                                          <motion.div
                                            key={`${item.aspectRatio}-${idx}`}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: isActive ? 0.9 : 0.45, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className={`absolute border-2 ${isActive ? 'border-accent' : 'border-border-subtle'}`}
                                            style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
                                          >
                                            <div className="absolute -top-4 left-0 text-[10px] font-bold text-text-secondary bg-void border border-border-subtle px-2 py-0.5">
                                              {idx + 1}
                                            </div>
                                          </motion.div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <button onMouseDown={() => setIsComparing(true)} onMouseUp={() => setIsComparing(false)} className="absolute bottom-4 right-4 bg-surface text-text-primary px-4 py-2 text-xs font-bold border border-border-subtle z-20">
                                    {trans.compare_btn}
                                </button>
                               </>
                           )}
                        </div>
                    ) : isYouTubeMode ? (
                        <div className="w-full h-full border-2 border-dashed border-accent/40 flex flex-col items-center justify-center bg-surface group">
                            <div className="p-8 bg-elevated mb-6">
                                <YoutubeIcon className="w-20 h-20 text-red-600 opacity-20" />
                            </div>
                            <h2 className="text-2xl font-black text-text-secondary tracking-tighter uppercase">Studio miniatur</h2>
                        </div>
                    ) : null}
                </div>

                {!isYouTubeMode && autoCropSuggestions.length > 0 && (
                    <div className="absolute bottom-4 left-4 z-40 bg-surface border border-border-subtle p-4">
                        <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-accent">AI ořez</div>
                            <button
                                onClick={() => {
                                    setAutoCropSuggestions([]);
                                    setAutoCropImageSize(null);
                                    setManualEdits(prev => ({ ...prev, cropRect: undefined }));
                                }}
                                className="text-[10px] text-text-secondary hover:text-text-primary"
                            >
                                Zrušit
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {autoCropSuggestions.slice(0, 3).map((item, index) => (
                                <button
                                    key={`${item.aspectRatio}-${index}`}
                                    onClick={() => {
                                        setAutoCropSelectedIndex(index);
                                        setManualEdits(prev => ({
                                            ...prev,
                                            cropRect: item.rect,
                                            aspectRatio: undefined
                                        }));
                                    }}
                                    className={`px-3 py-2 text-[11px] font-bold border transition-none ${
                                        autoCropSelectedIndex === index
                                            ? 'bg-elevated border-accent text-text-primary'
                                            : 'bg-elevated border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent'
                                    }`}
                                >
                                    {index + 1}. {item.aspectRatio}
                                    <span className="ml-2 text-[10px] text-text-secondary">{Math.round((item.confidence || 0) * 100)}%</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-2 text-[10px] text-text-secondary">Zkratky: 1, 2, 3</div>
                    </div>
                )}
                
                {isLoading && (
                    <div className="absolute inset-0 bg-void/80 z-50 flex flex-col items-center justify-center">
                        <CinematicLoader label={loadingMessage || 'Processing'} />
                    </div>
                )}
            </div>

            {/* Controls Sidebar */}
            <AnimatePresence>
            {!isFocusMode && (
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full lg:w-[420px] bg-surface border-l border-border-subtle flex flex-col z-20 overflow-y-auto custom-scrollbar"
            >
                
                {/* Job Log (Recent History) */}
                <div className="px-8 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Log úprav</h4>
                    <div className="flex gap-2">
                      <button onClick={onUndo} disabled={history.past.length === 0} className="p-1.5 bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30"><UndoIcon className="w-3 h-3" /></button>
                      <button onClick={onRedo} disabled={history.future.length === 0} className="p-1.5 bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30"><UndoIcon className="w-3 h-3 rotate-180" /></button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto mb-6">
                    {history.past.slice(-3).map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] text-text-secondary">
                        <HistoryIcon className="w-3 h-3" />
                        <span>{h.actionName}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-[10px] text-accent font-bold">
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

                {!isYouTubeMode && activeFile && (
                    <div className="px-8 mt-4">
                        <div className="p-4 border border-border-subtle bg-elevated">
                            <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">AI doporučení</div>
                            {liveSuggestions.length === 0 ? (
                                <div className="text-xs text-text-secondary">Vše vypadá dobře.</div>
                            ) : (
                                <div className="space-y-2">
                                    {liveSuggestions.map((item, idx) => (
                                        <div key={`${item}-${idx}`} className="text-xs text-text-secondary">
                                            • {item}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!isYouTubeMode && activeFile && (
                    <div className="px-8 mt-4">
                        <div className="p-4 border border-border-subtle bg-surface">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary">AI skóre</div>
                                <button onClick={handleScorePhoto} className="text-[10px] text-text-secondary hover:text-text-primary">Spustit</button>
                            </div>
                            {qualityAssessment ? (
                                <div className="space-y-2 text-xs text-text-secondary">
                                    <div className="flex items-center justify-between">
                                        <span>Skóre</span>
                                        <span className="text-text-primary font-bold">{qualityAssessment.score}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Best Pick</span>
                                        <span className="text-text-primary font-bold">{qualityAssessment.isBestPick ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(qualityAssessment.flags || []).slice(0, 6).map((flag) => (
                                            <span key={flag} className="px-2 py-1 border border-border-subtle bg-elevated text-[10px] text-text-secondary">
                                                {flag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-text-secondary">Zatím bez hodnocení.</div>
                            )}
                        </div>
                    </div>
                )}

                {!isYouTubeMode && activeFile && history.past.length > 0 && (
                    <div className="px-8 mt-4">
                        <div className="p-4 border border-border-subtle bg-surface">
                            <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Time Machine</div>
                            <div className="space-y-2">
                                {history.past.slice(-5).reverse().map((entry, idx) => (
                                    <button
                                        key={`${entry.actionName}-${idx}`}
                                        onClick={() => onSetFiles(() => entry.state, `Time Machine: ${entry.actionName}`)}
                                        className="w-full text-left text-xs text-text-secondary hover:text-text-primary px-3 py-2 border border-border-subtle bg-elevated hover:bg-elevated transition-none"
                                    >
                                        {entry.actionName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-8 space-y-8 pt-2">
                    {isYouTubeMode && (
                        <div className="space-y-6 animate-fade-in-right">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">{trans.tool_youtube_topic}</label>
                                <textarea rows={3} value={thumbnailTopic} onChange={(e) => setThumbnailTopic(e.target.value)} placeholder={trans.tool_youtube_topic_ph} className="w-full bg-elevated border border-border-subtle p-4 text-sm text-text-primary outline-none placeholder:text-text-secondary" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">{trans.tool_youtube_text}</label>
                                <input type="text" value={thumbnailText} onChange={(e) => setThumbnailText(e.target.value)} placeholder={trans.tool_youtube_text_ph} className="w-full bg-elevated border border-border-subtle p-4 text-sm text-text-primary outline-none placeholder:text-text-secondary" />
                            </div>
                             <div className="flex items-center justify-between text-xs text-text-secondary">
                                <span>{trans.credits_cost}:</span>
                                <span className="font-bold text-warning">10 {trans.credits_remaining}</span>
                             </div>
                             <button onClick={handleGenerateThumbnail} disabled={isLoading} className="w-full py-4 bg-accent text-void text-sm font-black border border-accent transition-none flex items-center justify-center gap-3 disabled:opacity-50">
                                <SparklesIcon className="w-5 h-5" />
                                {trans.tool_youtube_btn}
                            </button>
                        </div>
                    )}

                    {!isYouTubeMode && activeFile && (
                         <ManualEditControls
                           edits={manualEdits}
                           onEditChange={(k, v) => setManualEdits(p => ({...p, [k]: v}))}
                           onReset={() => setManualEdits(INITIAL_EDITS)}
                           exportOptions={exportOptions}
                           onExportOptionsChange={setExportOptions}
                           onRequestExport={handleManualExport}
                           onStartManualCrop={() => {}}
                           onSnapshot={handleSnapshot}
                           cropRef={cropRef}
                           lightRef={lightRef}
                           colorRef={colorRef}
                           detailRef={detailRef}
                           exportRef={exportRef}
                         />
                    )}
                </div>
            </motion.div>
            )}
            </AnimatePresence>
        </div>

        <AnimatePresence>
          {!isFocusMode && !isYouTubeMode && activeFile && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
              <FloatingDock
                items={[
                  { id: 'crop', label: 'Crop', onClick: () => cropRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
                  { id: 'light', label: 'Light', onClick: () => lightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
                  { id: 'color', label: 'Color', onClick: () => colorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
                  { id: 'detail', label: 'Detail', onClick: () => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
                  { id: 'export', label: 'Export', onClick: () => exportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) },
                ]}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isFocusMode && (
          <div className="absolute top-4 right-6 z-40">
            <button
              onClick={() => setIsFocusMode(false)}
              className="px-3 py-2 text-[11px] font-bold border border-border-subtle bg-surface text-text-secondary hover:text-text-primary hover:bg-elevated transition-none"
            >
              Exit Focus
            </button>
          </div>
        )}

        <AnimatePresence>
          {radialMenu && (
            <RadialMenu
              x={radialMenu.x}
              y={radialMenu.y}
              onClose={() => setRadialMenu(null)}
              items={[
                { id: 'autopilot', label: 'Autopilot', onClick: handleAutopilot },
                { id: 'auto-crop', label: 'Auto‑ořez', onClick: handleAutoCrop },
                { id: 'select-subject', label: 'Vybrat subjekt', onClick: handleSmartSelect },
                { id: 'remove-bg', label: 'Odstranit pozadí', onClick: handleBackgroundRemoval },
                { id: 'replace-bg', label: 'Vyměnit pozadí', onClick: () => setShowBgModal(true) },
                { id: 'face', label: 'Vylepšit obličej', onClick: handleFaceEnhance },
                { id: 'score', label: 'AI skóre', onClick: handleScorePhoto },
                { id: 'compare', label: isComparing ? 'Zastavit porovnání' : 'Porovnat', onClick: () => setIsComparing((p) => !p) },
                { id: 'export', label: 'Export', onClick: handleManualExport },
              ]}
            />
          )}
        </AnimatePresence>

        {showBgModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg border border-border-subtle bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-black uppercase tracking-widest text-text-secondary">Vyměnit pozadí</div>
                <button onClick={() => setShowBgModal(false)} className="text-xs text-text-secondary hover:text-text-primary">Zavřít</button>
              </div>
              <textarea
                rows={4}
                value={bgPrompt}
                onChange={(e) => setBgPrompt(e.target.value)}
                placeholder="např. neonová ulice v Tokiu, zlatá hodinka, studiové pozadí"
                className="w-full bg-elevated border border-border-subtle px-4 py-3 text-sm text-text-primary outline-none"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-text-secondary">Cena: 5 kreditů</span>
                <button
                  onClick={handleBackgroundReplace}
                  className="px-4 py-2 text-[11px] font-bold bg-accent text-void"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default EditorView;



