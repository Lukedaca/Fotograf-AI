import React from 'react';
import { SunIcon, MoonIcon } from './icons';
import { useTranslation } from '../contexts/LanguageContext';

interface ThemeToggleButtonProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ isDarkMode, onToggle }) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={onToggle}
      className="p-2 border border-border-subtle text-text-secondary hover:text-accent hover:border-accent transition-none"
      title={t.theme_toggle}
    >
      {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
    </button>
  );
};

export default ThemeToggleButton;


