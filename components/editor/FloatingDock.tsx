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
    <div className="fixed bottom-6 right-6 z-40 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 border border-border-subtle bg-surface px-3 py-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="px-3 py-2 text-[11px] font-semibold text-text-secondary hover:text-text-primary border border-transparent hover:border-accent transition-none"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FloatingDock;
