import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Header from '../Header';
import CompareSlider from '../CompareSlider';
import { SparklesIcon } from '../icons';
import { useTranslation } from '../../contexts/LanguageContext';
import type { EnhancementMode, UploadedFile } from '../../types';
import { runAutopilot } from '../../services/aiAutopilot';
import MagneticButton from '../common/MagneticButton';

interface AICommandCenterProps {
  title: string;
  onToggleSidebar: () => void;
  credits?: number;
  onBuyCredits?: () => void;
  onOpenApiKeyModal?: () => void;
  files: UploadedFile[];
  activeFileId: string | null;
  onSetFiles: (updater: (files: UploadedFile[]) => UploadedFile[], actionName: string) => void;
  onSetActiveFileId: (id: string | null) => void;
  onDeductCredits: (amount: number) => Promise<boolean>;
  addNotification: (message: string, type?: 'info' | 'error') => void;
}

const AICommandCenter: React.FC<AICommandCenterProps> = ({
  title,
  onToggleSidebar,
  credits,
  onBuyCredits,
  onOpenApiKeyModal,
  files,
  activeFileId,
  onSetFiles,
  onSetActiveFileId,
  onDeductCredits,
  addNotification,
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<EnhancementMode>('auto');
  const [enhancedPreviewUrl, setEnhancedPreviewUrl] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stylePresets, setStylePresets] = useState<{ id: string; name: string }[]>([]);
  const activeFile = useMemo(() => files.find((f) => f.id === activeFileId) || null, [files, activeFileId]);

  useEffect(() => {
    if (!activeFileId && files.length > 0) {
      onSetActiveFileId(files[0].id);
    }
  }, [activeFileId, files, onSetActiveFileId]);

  useEffect(() => {
    return () => {
      if (enhancedPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(enhancedPreviewUrl);
      }
    };
  }, [enhancedPreviewUrl]);

  const modes: { id: EnhancementMode; label: string }[] = [
    { id: 'auto', label: 'Auto' },
    { id: 'portrait', label: 'Portrait' },
    { id: 'landscape', label: 'Landscape' },
    { id: 'product', label: 'Product' },
    { id: 'food', label: 'Food' },
    { id: 'real-estate', label: 'Real Estate' },
    { id: 'social-media', label: 'Social Media' },
    { id: 'cinematic', label: 'Cinematic' },
    { id: 'your-style', label: 'Your Style' },
  ];

  const handleRun = useCallback(async () => {
    if (!activeFile) return;
    const COST = 3;
    if (!await onDeductCredits(COST)) return;
    setIsRunning(true);
    try {
      const result = await runAutopilot(activeFile.file, mode);
      setStylePresets(result.stylePresets.map((preset) => ({ id: preset.id, name: preset.name })));
      if (result.enhancedFile) {
        const url = URL.createObjectURL(result.enhancedFile);
        setEnhancedPreviewUrl((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
          return url;
        });
        onSetFiles(current => current.map(f => f.id === activeFile.id ? { ...f, file: result.enhancedFile!, previewUrl: url } : f), 'AI Command Center');
      }
      addNotification(t.msg_success, 'info');
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (message.includes('API_KEY_MISSING') || message.toLowerCase().includes('api key')) {
        onOpenApiKeyModal?.();
      }
      addNotification(t.msg_error, 'error');
    } finally {
      setIsRunning(false);
    }
  }, [activeFile, addNotification, mode, onDeductCredits, onOpenApiKeyModal, onSetFiles, t.msg_error, t.msg_success]);

  return (
    <div className="flex-1 flex flex-col h-full bg-void text-text-primary">
      <Header
        title={title}
        onToggleSidebar={onToggleSidebar}
        credits={credits}
        onBuyCredits={onBuyCredits}
        onOpenApiKeyModal={onOpenApiKeyModal}
      />

      <div className="flex-1 grid lg:grid-cols-[1.2fr_0.8fr] gap-6 p-6 overflow-hidden">
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-border-subtle bg-surface p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">AI Command Center</h2>
                <p className="text-sm text-text-secondary">Side-by-side preview and AI analysis.</p>
              </div>
              <span className="text-xs font-mono text-text-secondary">STATUS: FOUNDATION</span>
            </div>
            <div className="mb-4">
              <label className="text-[11px] text-text-secondary uppercase tracking-widest">Source File</label>
              <select
                value={activeFileId || ''}
                onChange={(e) => onSetActiveFileId(e.target.value)}
                className="mt-2 w-full rounded-xl bg-elevated border border-border-subtle px-3 py-2 text-xs text-text-primary"
              >
                {files.length === 0 && <option value="">No files available</option>}
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.file.name}
                  </option>
                ))}
              </select>
            </div>
            {activeFile && enhancedPreviewUrl ? (
              <div className="aspect-[4/3] rounded-2xl border border-border-subtle bg-elevated overflow-hidden">
                <CompareSlider beforeUrl={activeFile.originalPreviewUrl} afterUrl={enhancedPreviewUrl} />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="aspect-[4/3] rounded-2xl border border-border-subtle bg-elevated flex items-center justify-center text-text-secondary text-sm overflow-hidden">
                  {activeFile ? (
                    <img src={activeFile.originalPreviewUrl} alt="Original" className="w-full h-full object-contain" />
                  ) : (
                    'Original'
                  )}
                </div>
                <div className="aspect-[4/3] rounded-2xl border border-border-subtle bg-elevated flex items-center justify-center text-text-secondary text-sm overflow-hidden">
                  {enhancedPreviewUrl ? (
                    <img src={enhancedPreviewUrl} alt="AI Enhanced" className="w-full h-full object-contain" />
                  ) : (
                    'AI Enhanced'
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border-subtle bg-surface p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-4">AI Analysis</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {['Exposure', 'Colors', 'Focus', 'Composition'].map((item) => (
                <div key={item} className="rounded-2xl border border-border-subtle bg-elevated p-4">
                  <div className="text-xs text-text-secondary">{item}</div>
                  <div className="text-lg font-bold text-text-primary mt-2">—</div>
                  <div className="text-[11px] text-text-secondary mt-2">Waiting for analysis…</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-border-subtle bg-surface p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-4">Enhancement Modes</h3>
            <div className="grid grid-cols-2 gap-3">
              {modes.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setMode(option.id)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                    option.id === mode
                      ? 'border-accent-secondary text-text-primary bg-elevated'
                      : 'border-border-subtle bg-elevated text-text-secondary hover:text-text-primary hover:border-accent-secondary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <MagneticButton
              className="mt-5 w-full py-3 rounded-2xl font-bold text-void bg-accent-primary shadow-lg shadow-black/30 flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={isRunning || !activeFile}
              aria-disabled={isRunning || !activeFile}
              onClick={handleRun}
            >
              <SparklesIcon className="w-4 h-4" />
              {isRunning ? 'ProbĂ­hĂˇ...' : 'Spustit Autopilot'}
            </MagneticButton>
            <p className="text-[11px] text-text-secondary mt-3">{t.credits_cost}: 3</p>
          </div>

          <div className="rounded-3xl border border-border-subtle bg-surface p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-3">AI Suggestions</h3>
            <div className="space-y-3 text-sm text-text-secondary">
              <div className="rounded-xl border border-border-subtle bg-elevated p-3">
                â€¢ ZvĂ˝Ĺˇit kontrast pro dramatiÄŤtÄ›jĹˇĂ­ dojem
              </div>
              <div className="rounded-xl border border-border-subtle bg-elevated p-3">
                â€¢ OĹ™Ă­znout pro rule of thirds kompozici
              </div>
              <div className="rounded-xl border border-border-subtle bg-elevated p-3">
                â€¢ PĹ™idat vignette pro focus na subjekt
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border-subtle bg-surface p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary mb-3">Style Presets</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {(stylePresets.length > 0 ? stylePresets : [
                { id: 'default-1', name: 'Soft Glow' },
                { id: 'default-2', name: 'Punchy' },
                { id: 'default-3', name: 'Matte' },
              ]).map((preset) => (
                <div key={preset.id} className="min-w-[140px] rounded-2xl border border-border-subtle bg-elevated p-4 text-xs text-text-secondary">
                  <div className="text-text-primary font-bold mb-2">{preset.name}</div>
                  <div className="text-[10px] text-text-secondary">AI generated preset</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICommandCenter;
