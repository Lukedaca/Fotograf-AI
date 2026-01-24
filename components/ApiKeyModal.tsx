import React, { useEffect, useState } from 'react';
import { KeyIcon, XIcon } from './icons';
import { useTranslation } from '../contexts/LanguageContext';
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl relative">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all"
            >
                <XIcon className="w-5 h-5" />
            </button>

            <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-cyan-500/10 rounded-xl">
                        <KeyIcon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">API Key Selection</h2>
                        <p className="text-xs text-slate-400">Google Gemini API</p>
                    </div>
                </div>

                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                    Zadejte API klíč pro Google Gemini. Uloží se pouze lokálně v prohlížeči.
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-xs text-slate-400">API Key</label>
                        <input
                            type="password"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="AIza..."
                            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                        {storedKey && (
                            <p className="text-[11px] text-emerald-400">Uložený klíč: ••••••••{storedKey.slice(-4)}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleSave}
                            className="py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-600 hover:to-fuchsia-700 transition-all transform hover:-translate-y-0.5 shadow-lg aurora-glow"
                        >
                            {storedKey ? 'Aktualizovat klíč' : 'Uložit klíč'}
                        </button>
                        <button
                            onClick={handleClear}
                            className="py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
                            disabled={!storedKey}
                        >
                            Smazat klíč
                        </button>
                    </div>

                    <div className="mt-4 space-y-3">
                        <label className="flex items-center gap-2 text-xs text-slate-400">
                            <input
                                type="checkbox"
                                checked={sessionOnly}
                                onChange={(e) => {
                                    const next = e.target.checked;
                                    setSessionOnlyState(next);
                                    setSessionOnly(next);
                                }}
                            />
                            Vymazat klĂ­ÄŤ po zavĹ™enĂ­ prohlĂ­ĹľeÄŤe
                        </label>
                        <div className="text-[11px] text-slate-500 leading-relaxed border border-slate-800 rounded-lg p-3 bg-slate-950">
                            VĂˇĹˇ API klĂ­ÄŤ zĹŻstĂˇvĂˇ pouze v tomto prohlĂ­ĹľeÄŤi. Nikdy ho neodesĂ­lĂˇme na server ani na GitHub.
                        </div>
                    </div>

                    <div className="mt-6 text-center text-xs text-slate-500">
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Billing Information</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ApiKeyModal;

