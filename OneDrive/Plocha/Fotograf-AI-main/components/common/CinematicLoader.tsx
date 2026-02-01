import React from 'react';
import { motion } from 'framer-motion';

const CinematicLoader: React.FC<{ label?: string }> = ({ label = 'Zpracovávám' }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-border-subtle"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-3 rounded-full border-2 border-accent/60"
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-text-secondary">
          24
        </div>
      </div>
      <div className="mt-4 text-xs font-black uppercase tracking-widest text-text-secondary">{label}</div>
    </div>
  );
};

export default CinematicLoader;
