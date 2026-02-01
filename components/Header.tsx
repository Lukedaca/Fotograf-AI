
import React from 'react';
import { KeyIcon, MenuIcon, SparklesIcon } from './icons';
import Button from './common/Button';
import { useTranslation } from '../contexts/LanguageContext';

interface HeaderProps {
  title: string;
  onToggleSidebar: () => void;
  credits?: number;
  onBuyCredits?: () => void;
  onOpenApiKeyModal?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onToggleSidebar, credits, onBuyCredits, onOpenApiKeyModal }) => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <header className="flex-shrink-0 flex items-center h-20 px-8 w-full bg-transparent z-30">
      {/* Mobile Menu Button */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 -ml-2 mr-4 text-white/50 hover:text-white transition-colors"
        aria-label="Otevřít menu"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Title */}
      <div className="flex-1">
          <h1 className="text-lg font-semibold text-white/90 tracking-tight">{title}</h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-4">

        {onOpenApiKeyModal && (
            <button 
                onClick={onOpenApiKeyModal} 
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
            >
                <KeyIcon className="w-3.5 h-3.5" />
                <span>API</span>
            </button>
        )}
        
        {/* Credits Display */}
        {credits !== undefined && (
            <button 
                onClick={onBuyCredits} 
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600/50 to-fuchsia-600/50 border border-white/10 text-xs font-bold text-white hover:brightness-110 transition-all shadow-lg shadow-violet-500/20 backdrop-blur-md"
                title={t.credits_buy}
            >
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>{credits}</span>
            </button>
        )}

        {/* Language Toggle */}
        <div className="flex bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
            <button 
                onClick={() => setLanguage('cs')} 
                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${language === 'cs' ? 'bg-white text-black shadow-md' : 'text-white/50 hover:text-white'}`}
            >
                CS
            </button>
            <button 
                onClick={() => setLanguage('en')} 
                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${language === 'en' ? 'bg-white text-black shadow-md' : 'text-white/50 hover:text-white'}`}
            >
                EN
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

