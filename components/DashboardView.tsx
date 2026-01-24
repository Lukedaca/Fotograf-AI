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
    <div className="w-full h-full flex flex-col bg-void text-text-primary overflow-y-auto custom-scrollbar">
      <Header
        title={t.nav_studio}
        onToggleSidebar={onToggleSidebar}
        credits={credits}
        onBuyCredits={onBuyCredits}
        onOpenApiKeyModal={onOpenApiKeyModal}
      />

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-10 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <button
            onClick={() => onNavigate({ view: 'upload' })}
            className="group w-full text-left border border-border-subtle bg-surface p-6 transition-none hover:border-accent"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-text-secondary">Pipeline</div>
                <h2 className="heading text-2xl mt-2">{t.dashboard_new_job}</h2>
                <p className="text-xs text-text-secondary mt-2 max-w-xs">Začni novou zakázku a postav pipeline od importu po export.</p>
              </div>
              <UploadIcon className="w-10 h-10 text-accent" />
            </div>
            <div className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-widest text-text-secondary">
              <span>Spustit workflow</span>
              <ChevronDoubleLeftIcon className="w-4 h-4 rotate-180" />
            </div>
          </button>

          <button
            onClick={() => onNavigate({ view: 'editor' })}
            className="group w-full text-left border border-border-subtle bg-surface p-6 transition-none hover:border-accent"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-text-secondary">Studio</div>
                <h2 className="heading text-2xl mt-2">{t.dashboard_continue}</h2>
                <p className="text-xs text-text-secondary mt-2 max-w-xs">Navážeš tam, kde jsi skončil.</p>
              </div>
              <LogoIcon className="w-10 h-10 text-white" />
            </div>
            <div className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-widest text-text-secondary">
              <span>Otevřít studio</span>
              <ChevronDoubleLeftIcon className="w-4 h-4 rotate-180" />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Rychlé akce</h3>
            <button
              onClick={() => onNavigate({ view: 'batch', action: 'culling' })}
              className="w-full flex items-center gap-4 p-4 border border-border-subtle bg-elevated hover:border-accent transition-none"
            >
              <div className="p-2 border border-border-subtle">
                <SparklesIcon className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <div className="font-bold text-text-primary">{t.dashboard_quick_culling}</div>
                <div className="text-[10px] text-text-secondary uppercase tracking-widest">Krok 2</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate({ view: 'editor', action: 'autopilot' })}
              className="w-full flex items-center gap-4 p-4 border border-border-subtle bg-elevated hover:border-accent transition-none"
            >
              <div className="p-2 border border-border-subtle">
                <AutopilotIcon className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <div className="font-bold text-text-primary">{t.dashboard_quick_autopilot}</div>
                <div className="text-[10px] text-text-secondary uppercase tracking-widest">Krok 3</div>
              </div>
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">{t.dashboard_recent}</h3>
              <span className="text-[10px] font-mono text-text-secondary">{recentHistory.length} záznamů</span>
            </div>
            <div className="border border-border-subtle bg-surface">
              {recentHistory.length > 0 ? (
                recentHistory.slice(-5).reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border-b border-border-subtle last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 border border-border-subtle">
                        <HistoryIcon className="w-4 h-4 text-text-secondary" />
                      </div>
                      <span className="text-sm font-bold text-text-primary">{entry.actionName}</span>
                    </div>
                    <span className="text-[10px] text-text-secondary font-mono">{entry.state.length} souborů</span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-text-secondary text-sm">{t.dashboard_no_recent}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
