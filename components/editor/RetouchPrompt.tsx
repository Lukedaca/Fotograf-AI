import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon } from '../icons';
import { useTranslation } from '../../contexts/LanguageContext';

interface RetouchPromptProps {
  onSubmit: (prompt: string) => void;
  isProcessing: boolean;
  lastPrompts?: string[];
}

const RetouchPrompt: React.FC<RetouchPromptProps> = ({ onSubmit, isProcessing, lastPrompts = [] }) => {
  const [prompt, setPrompt] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { language } = useTranslation();
  const isCz = language === 'cs';

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed || isProcessing) return;
    onSubmit(trimmed);
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 80) + 'px';
    }
  }, [prompt]);

  const placeholderText = isCz
    ? 'Napiš co chceš retušovat... (např. odstraň vrásky, vyhlaď pleť, odstraň objekt vlevo)'
    : 'Describe what to retouch... (e.g. remove wrinkles, smooth skin, remove object on left)';

  return (
    <div className="relative">
      <div className="flex items-end gap-2 bg-surface/90 backdrop-blur-md border border-border-subtle rounded-xl px-3 py-2 shadow-lg">
        <SparklesIcon className="w-4 h-4 text-accent flex-shrink-0 mb-1.5" />
        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => lastPrompts.length > 0 && setShowHistory(true)}
          onBlur={() => setTimeout(() => setShowHistory(false), 200)}
          placeholder={placeholderText}
          rows={1}
          disabled={isProcessing}
          className="flex-1 bg-transparent text-text-primary text-sm placeholder:text-text-secondary/50 resize-none outline-none min-h-[24px] max-h-[80px] disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isProcessing}
          className="flex-shrink-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-30 bg-accent text-void hover:bg-accent/80"
        >
          {isProcessing ? (isCz ? 'AI pracuje...' : 'Processing...') : (isCz ? 'Odeslat' : 'Send')}
        </button>
      </div>

      {/* Prompt history dropdown */}
      {showHistory && lastPrompts.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface/95 backdrop-blur-md border border-border-subtle rounded-xl shadow-xl max-h-40 overflow-y-auto z-50">
          <div className="p-1">
            {lastPrompts.map((p, i) => (
              <button
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setPrompt(p);
                  setShowHistory(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors truncate"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RetouchPrompt;
