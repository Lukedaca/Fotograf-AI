
import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { XIcon, SparklesIcon } from './icons';
import type { JobTemplate } from '../types';

interface JobTemplateModalProps {
  onSelect: (template: JobTemplate) => void;
  onClose: () => void;
}

const JobTemplateModal: React.FC<JobTemplateModalProps> = ({ onSelect, onClose }) => {
  const { t } = useTranslation();

  const templates: { id: JobTemplate, title: string, desc: string, icon: string, color: string }[] = [
    { id: 'portrait', title: t.template_portrait, desc: t.template_portrait_desc, icon: '👤', color: '#8B5CF6' },
    { id: 'event', title: t.template_event, desc: t.template_event_desc, icon: '💍', color: '#F59E0B' },
    { id: 'product', title: t.template_product, desc: t.template_product_desc, icon: '📦', color: '#10B981' },
    { id: 'social', title: t.template_social, desc: t.template_social_desc, icon: '📱', color: '#3B82F6' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-surface border border-border-subtle overflow-hidden relative">
        <div className="p-8 lg:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">{t.template_title}</h2>
            <p className="text-text-secondary text-sm max-w-lg mx-auto leading-relaxed">{t.template_desc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <button 
                key={tpl.id}
                onClick={() => onSelect(tpl.id)}
                className="group relative flex items-start gap-6 p-6 bg-elevated border border-border-subtle transition-none"
              >
                <div className="w-16 h-16 flex-shrink-0 border border-border-subtle bg-void flex items-center justify-center text-3xl">
                  {tpl.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white mb-1">{tpl.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{tpl.desc}</p>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SparklesIcon className="w-4 h-4 text-white/20" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button 
              onClick={() => onSelect('none')}
              className="text-xs font-black uppercase tracking-widest text-text-secondary hover:text-accent transition-colors"
            >
              {t.template_skip}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobTemplateModal;


