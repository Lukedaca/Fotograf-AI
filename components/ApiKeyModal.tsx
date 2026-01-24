import React, { useMemo, useState } from 'react';
import { KeyIcon, XIcon } from './icons';
import { useTranslation } from '../contexts/LanguageContext';
import { clearApiKey, getApiKey, setApiKey } from '../utils/apiKey';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const storedKey = useMemo(() => getApiKey(), [isOpen]);

  const handleSave = () => {
      if (!apiKeyInput.trim()) return;
      setApiKey(apiKeyInput);
      setApiKeyInput('');
      onClose();
  };

  const handleClear = () => {
      clearApiKey();
      setApiKeyInput('');
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
                    Zadejte API klíč pro Google Gemini. Uloží se lokálně v prohlížeči.
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

                    <button
                        onClick={handleSave}
                        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-600 hover:to-fuchsia-700 transition-all transform hover:-translate-y-0.5 shadow-lg aurora-glow"
                    >
                        Uložit API klíč
                    </button>

                    {storedKey && (
                        <button
                            onClick={handleClear}
                            className="w-full py-2 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
                        >
                            Odebrat uložený klíč
                        </button>
                    )}

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
