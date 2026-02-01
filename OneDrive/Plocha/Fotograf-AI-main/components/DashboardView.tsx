import React from 'react';
import Header from './Header';
import { useTranslation } from '../contexts/LanguageContext';
import { LogoIcon, UploadIcon, HistoryIcon, AutopilotIcon, SparklesIcon, ChevronDoubleLeftIcon } from './icons';
import type { View, HistoryEntry } from '../types';

interface DashboardViewProps {
  onNavigate: (payload: { view: View; action?: string }) => void;
  onToggleSidebar: () => void;
  credits: number;
  recentHistory: HistoryEntry[];
  onBuyCredits: () => void;
  onOpenApiKeyModal?: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onToggleSidebar,
  credits,
  recentHistory,
  onBuyCredits,
  onOpenApiKeyModal,
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col bg-transparent text-white overflow-y-auto custom-scrollbar">
      <Header
        title={t.nav_studio}
        onToggleSidebar={onToggleSidebar}
        credits={credits}
        onBuyCredits={onBuyCredits}
        onOpenApiKeyModal={onOpenApiKeyModal}
      />

      <div className="flex-1 p-8 lg:p-12 max-w-[1600px] mx-auto w-full space-y-8 animate-fade-in">
        
        {/* Greeting */}
        <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                {t.app_title}
            </h1>
            <p className="text-lg text-white/60">{t.nav_studio}</p>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {/* New Project (Primary) */}
          <button
            onClick={() => onNavigate({ view: 'upload' })}
            className="col-span-1 md:col-span-2 row-span-2 group relative os-glass-light rounded-[2.5rem] p-8 text-left overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-white/10"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/30 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:bg-violet-500/40 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-white backdrop-blur-md shadow-inner border border-white/20">
                <UploadIcon className="w-8 h-8" />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold mb-2">{t.dashboard_new_job}</h2>
                <p className="text-white/60 text-lg leading-relaxed">{t.pipeline_step_import}</p>
              </div>
            </div>
          </button>

          {/* Smart Cull (Tall) */}
          <button
            onClick={() => onNavigate({ view: 'batch', action: 'culling' })}
            className="col-span-1 row-span-2 group relative os-glass-light rounded-[2.5rem] p-8 text-left overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-white/10"
          >
             <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-fuchsia-500/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
             
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-12 h-12 bg-fuchsia-500/20 rounded-2xl flex items-center justify-center text-fuchsia-200">
                    <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-1">{t.pipeline_step_culling}</h2>
                    <p className="text-white/60">{t.dashboard_quick_culling}</p>
                </div>
             </div>
          </button>

          {/* Continue (Small) */}
          <button
            onClick={() => onNavigate({ view: 'editor' })}
            className="col-span-1 md:col-span-1 lg:col-span-1 group relative h-48 os-glass-light rounded-[2rem] p-6 text-left overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-white/10"
          >
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-200">
                        <LogoIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-full text-white/80 uppercase tracking-tighter">RESUME</span>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-1">{t.dashboard_continue}</h2>
                    <p className="text-white/60 text-sm">{t.nav_studio}</p>
                </div>
             </div>
          </button>

          {/* Auto Pilot (Small) */}
          <button
            onClick={() => onNavigate({ view: 'editor', action: 'autopilot' })}
            className="col-span-1 md:col-span-1 lg:col-span-1 group relative h-48 os-glass-light rounded-[2rem] p-6 text-left overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-white/10"
          >
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-200">
                    <AutopilotIcon className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-1">{t.pipeline_step_edit}</h2>
                    <p className="text-white/60 text-sm">{t.dashboard_quick_autopilot}</p>
                </div>
             </div>
          </button>

        </div>

        {/* Recent Files (Glass List) */}
        <div className="os-glass-light rounded-[2rem] p-8">
            <h3 className="text-lg font-bold mb-6 ml-2">{t.dashboard_recent}</h3>
            {recentHistory.length > 0 ? (
                <div className="space-y-2">
                    {recentHistory.slice(-5).reverse().map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors cursor-default group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white group-hover:scale-110 transition-all">
                                    <HistoryIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">{entry.actionName}</div>
                                    <div className="text-xs text-white/40">{new Date().toLocaleDateString()}</div>
                                </div>
                            </div>
                            <span className="text-sm font-medium bg-white/5 px-3 py-1 rounded-full text-white/70">{entry.state.length}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center text-white/40">{t.dashboard_no_recent}</div>
            )}
        </div>

      </div>
    </div>
  );
};

export default DashboardView;
