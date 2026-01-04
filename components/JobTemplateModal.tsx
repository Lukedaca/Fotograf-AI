
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
    { id: 'portrait', title: t.template_portrait, desc: t.template_portrait_desc, icon: '👤', color: 'from-blue-500 to-cyan-400' },
    { id: 'event', title: t.template_event, desc: t.template_event_desc, icon: '💍', color: 'from-fuchsia-500 to-pink-500' },
    { id: 'product', title: t.template_product, desc: t.template_product_desc, icon: '📦', color: 'from-amber-400 to-orange-500' },
    { id: 'social', title: t.template_social, desc: t.template_social_desc, icon: '📱', color: 'from-emerald-400 to-teal-500' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="p-8 lg:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">{t.template_title}</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">{t.template_desc}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <button 
                key={tpl.id}
                onClick={() => onSelect(tpl.id)}
                className="group relative flex items-start gap-6 p-6 bg-slate-800/30 border border-white/5 rounded-3xl hover:bg-slate-800 transition-all transform hover:-translate-y-1"
              >
                <div className={`w-16 h-16 flex-shrink-0 rounded-2xl bg-gradient-to-br ${tpl.color} flex items-center justify-center text-3xl shadow-lg`}>
                  {tpl.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white mb-1">{tpl.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{tpl.desc}</p>
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
              className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-cyan-400 transition-colors"
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
