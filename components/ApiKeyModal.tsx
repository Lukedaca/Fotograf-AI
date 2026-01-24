import React, { useEffect, useState } from 'react';
import { KeyIcon, XIcon } from './icons';
import { useTranslation } from '../contexts/LanguageContext';
import Button from './common/Button';
import { clearApiKey, getApiKey, isSessionOnly, setApiKey, setSessionOnly } from '../utils/apiKey';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [sessionOnly, setSessionOnlyState] = useState(false);

  useEffect(() => {
      if (!isOpen) return;
      setStoredKey(getApiKey());
      setSessionOnlyState(isSessionOnly());
  }, [isOpen]);

  const handleSave = () => {
      if (!apiKeyInput.trim()) return;
      setApiKey(apiKeyInput);
      setApiKeyInput('');
      setStoredKey(getApiKey());
      onClose();
  };

  const handleClear = () => {
      clearApiKey();
      setApiKeyInput('');
      setStoredKey(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
        <div className="w-full max-w-lg bg-surface border border-border-subtle overflow-hidden relative">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary border border-border-subtle"
            >
                <XIcon className="w-5 h-5" />
            </button>

            <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 border border-border-subtle">
                        <KeyIcon className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                        <h2 className="text-xl heading">API klíč</h2>
                        <p className="text-xs text-text-secondary uppercase tracking-widest">Google Gemini API</p>
                    </div>
                </div>

                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                    Zadejte API klíč pro Google Gemini. Uloží se pouze lokálně v prohlížeči.
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-xs text-text-secondary uppercase tracking-widest">API klíč</label>
                        <input
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="AIza..."
                            className="w-full bg-elevated border border-border-subtle px-4 py-3 text-sm text-text-primary outline-none"
                        />
                        {storedKey && (
                            <p className="text-[11px] text-success">Uložený klíč: ••••••••{storedKey.slice(-4)}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            onClick={handleSave}
                            className="py-3 text-xs"
                        >
                            {storedKey ? 'Aktualizovat klíč' : 'Uložit klíč'}
                        </Button>
                        <Button
                            onClick={handleClear}
                            variant="secondary"
                            className="py-3 text-xs"
                            disabled={!storedKey}
                        >
                            Smazat klíč
                        </Button>
                    </div>

                    <div className="mt-4 space-y-3">
                        <label className="flex items-center gap-2 text-xs text-text-secondary">
                            <input
                                type="checkbox"
                                checked={sessionOnly}
                                onChange={(e) => {
                                    const next = e.target.checked;
                                    setSessionOnlyState(next);
                                    setSessionOnly(next);
                                }}
                            />
                            Vymazat klíč po zavření prohlížeče
                        </label>
                        <div className="text-[11px] text-text-secondary leading-relaxed border border-border-subtle p-3 bg-elevated">
                            Váš API klíč zůstává pouze v tomto prohlížeči. Nikdy ho neodesíláme na server ani na GitHub.
                        </div>
                    </div>

                    <div className="mt-6 text-center text-xs text-text-secondary">
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-accent hover:underline">Informace o účtování</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ApiKeyModal;

