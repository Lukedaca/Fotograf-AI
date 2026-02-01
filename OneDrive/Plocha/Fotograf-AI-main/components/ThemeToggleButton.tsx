import React from 'react';
import { SunIcon, MoonIcon } from './icons';

interface ThemeToggleButtonProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ isDarkMode, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="p-2 border border-border-subtle text-text-secondary hover:text-accent hover:border-accent transition-none"
      title="Přepnout téma"
    >
      {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
    </button>
  );
};

export default ThemeToggleButton;


