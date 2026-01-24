
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
  onNavigate, onToggleSidebar, credits, recentHistory, onBuyCredits, onOpenApiKeyModal
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar">
      <Header 
        title={t.nav_studio} 
        onToggleSidebar={onToggleSidebar} 
        credits={credits} 
        onBuyCredits={onBuyCredits}
        onOpenApiKeyModal={onOpenApiKeyModal}
      />
      
      <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full space-y-12 animate-fade-in">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div 
            onClick={() => onNavigate({ view: 'upload' })}
            className="group relative overflow-hidden bg-gradient-to-br from-cyan-600 to-indigo-700 p-8 rounded-[2rem] shadow-2xl cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform">
              <UploadIcon className="w-40 h-40" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{t.dashboard_new_job}</h2>
                <p className="text-cyan-100/70 text-sm max-w-xs">{t.home_subtitle}</p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-white font-bold">
                <span>Start Pipeline</span>
                <ChevronDoubleLeftIcon className="w-4 h-4 rotate-180" />
              </div>
            </div>
          </div>

          <div 
            onClick={() => onNavigate({ view: 'editor' })}
            className="group relative overflow-hidden bg-slate-900 border border-white/5 p-8 rounded-[2rem] shadow-2xl cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform">
              <LogoIcon className="w-40 h-40" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{t.dashboard_continue}</h2>
                <p className="text-slate-500 text-sm max-w-xs">Navažte tam, kde jste skončili.</p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-slate-300 font-bold">
                <span>Open Studio</span>
                <ChevronDoubleLeftIcon className="w-4 h-4 rotate-180" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Quick Actions & History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Quick Actions</h3>
            <button 
              onClick={() => onNavigate({ view: 'batch', action: 'culling' })}
              className="w-full flex items-center gap-4 p-5 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-slate-800 transition-colors group"
            >
              <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <SparklesIcon className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-200">{t.dashboard_quick_culling}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Pipeline Step 2</div>
              </div>
            </button>

            <button 
              onClick={() => onNavigate({ view: 'editor', action: 'autopilot' })}
              className="w-full flex items-center gap-4 p-5 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-slate-800 transition-colors group"
            >
              <div className="p-3 bg-fuchsia-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <AutopilotIcon className="w-6 h-6 text-fuchsia-400" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-200">{t.dashboard_quick_autopilot}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Pipeline Step 3</div>
              </div>
            </button>
          </div>

          {/* Recent History */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6">{t.dashboard_recent}</h3>
            <div className="bg-slate-900/30 rounded-3xl border border-white/5 p-2 overflow-hidden">
              {recentHistory.length > 0 ? (
                recentHistory.slice(-5).reverse().map((entry, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors cursor-default"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-800 rounded-lg">
                        <HistoryIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-300">{entry.actionName}</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono">{entry.state.length} files</span>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-600 italic text-sm">
                  {t.dashboard_no_recent}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;
