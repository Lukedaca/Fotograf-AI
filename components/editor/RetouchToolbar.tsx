import React from 'react';
import type { RetouchTool } from './CanvasViewport';
import { useTranslation } from '../../contexts/LanguageContext';

interface RetouchToolbarProps {
  activeTool: RetouchTool;
  onToolChange: (tool: RetouchTool) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClearMask: () => void;
  onApplyMask: () => void;
  hasMask: boolean;
  isProcessing: boolean;
}

const BrushIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
  </svg>
);

const LassoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 100-12 6 6 0 000 12zm0 0v3m0 0h-3m3 0h3" />
  </svg>
);

const RectSelectIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" d="M4 4h16v16H4z" />
  </svg>
);

const CursorIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
  </svg>
);

const tools: { id: RetouchTool; icon: typeof BrushIcon; label: string; labelEn: string; shortcut: string }[] = [
  { id: 'none', icon: CursorIcon, label: 'Výběr', labelEn: 'Select', shortcut: 'V' },
  { id: 'brush', icon: BrushIcon, label: 'Štětec', labelEn: 'Brush', shortcut: 'B' },
  { id: 'lasso', icon: LassoIcon, label: 'Lasso', labelEn: 'Lasso', shortcut: 'L' },
  { id: 'rectangle', icon: RectSelectIcon, label: 'Obdélník', labelEn: 'Rectangle', shortcut: 'M' },
];

const RetouchToolbar: React.FC<RetouchToolbarProps> = ({
  activeTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  onClearMask,
  onApplyMask,
  hasMask,
  isProcessing,
}) => {
  const { language } = useTranslation();
  const isCz = language === 'cs';

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toUpperCase();
      if (key === 'V') onToolChange('none');
      if (key === 'B') onToolChange('brush');
      if (key === 'L') onToolChange('lasso');
      if (key === 'M') onToolChange('rectangle');
      if (e.code === 'BracketLeft' && activeTool === 'brush') {
        onBrushSizeChange(Math.max(4, brushSize - 8));
      }
      if (e.code === 'BracketRight' && activeTool === 'brush') {
        onBrushSizeChange(Math.min(200, brushSize + 8));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTool, brushSize, onToolChange, onBrushSizeChange]);

  return (
    <div className="flex items-center gap-1 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-xl px-2 py-1.5 shadow-lg">
      {/* Tool buttons */}
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          title={`${isCz ? tool.label : tool.labelEn} (${tool.shortcut})`}
          className={`p-2 rounded-lg transition-all ${
            activeTool === tool.id
              ? 'bg-accent/20 text-accent border border-accent/40'
              : 'text-text-secondary hover:text-text-primary hover:bg-elevated border border-transparent'
          }`}
        >
          <tool.icon className="w-4 h-4" />
        </button>
      ))}

      {/* Brush size slider */}
      {activeTool === 'brush' && (
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border-subtle">
          <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
            {isCz ? 'Velikost' : 'Size'}
          </span>
          <input
            type="range"
            min={4}
            max={200}
            value={brushSize}
            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
            className="w-20 h-1 accent-accent"
          />
          <span className="text-[10px] text-text-secondary min-w-[2rem] text-right">{brushSize}px</span>
        </div>
      )}

      {/* Divider + mask actions */}
      {hasMask && (
        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border-subtle">
          <button
            onClick={onClearMask}
            className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary bg-elevated border border-border-subtle rounded-lg transition-all"
          >
            {isCz ? 'Smazat výběr' : 'Clear'}
          </button>
          <button
            onClick={onApplyMask}
            disabled={isProcessing}
            className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-void bg-accent hover:bg-accent/80 rounded-lg transition-all disabled:opacity-50"
          >
            {isProcessing ? (isCz ? 'Zpracování...' : 'Processing...') : (isCz ? 'Retušovat' : 'Retouch')}
          </button>
        </div>
      )}
    </div>
  );
};

export default RetouchToolbar;
