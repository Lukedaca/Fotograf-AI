import React from 'react';

interface DockItem {
  id: string;
  label: string;
  onClick: () => void;
}

interface FloatingDockProps {
  items: DockItem[];
}

const FloatingDock: React.FC<FloatingDockProps> = ({ items }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border-subtle bg-surface/90 px-3 py-2 shadow-2xl backdrop-blur">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="px-3 py-2 text-[11px] font-semibold text-text-secondary hover:text-text-primary rounded-xl hover:bg-elevated transition-all"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FloatingDock;
