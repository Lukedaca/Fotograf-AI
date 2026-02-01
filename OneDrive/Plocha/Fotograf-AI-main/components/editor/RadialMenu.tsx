import React from 'react';
import { motion } from 'framer-motion';

interface RadialMenuItem {
  id: string;
  label: string;
  onClick: () => void;
}

interface RadialMenuProps {
  x: number;
  y: number;
  items: RadialMenuItem[];
  onClose: () => void;
}

const RadialMenu: React.FC<RadialMenuProps> = ({ x, y, items, onClose }) => {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute"
        style={{ left: x, top: y }}
      >
        <div className="border border-border-subtle bg-surface p-3 min-w-[180px]">
          <div className="text-[10px] text-text-secondary uppercase tracking-widest mb-2">Rychlé akce</div>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className="text-left px-3 py-2 text-[11px] font-semibold text-text-secondary hover:text-text-primary border border-transparent hover:border-accent transition-none"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RadialMenu;
