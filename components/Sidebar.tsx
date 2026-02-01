import React from 'react';
import type { EditorAction, View } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import {
  UploadIcon,
  AnalysisIcon,
  ManualEditIcon,
  BatchIcon,
  AutopilotIcon,
  AutoCropIcon,
  EraserIcon,
  GenerateImageIcon,
  ExportIcon,
  HistoryIcon,
  LogoIcon,
  ChevronDoubleLeftIcon,
  SparklesIcon,
} from './icons';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onNavigate: (payload: { view: View; action?: string }) => void;
  onToggleCollapse: () => void;
  currentView: View;
  activeAction: EditorAction;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive: boolean;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, onClick, isActive, isCollapsed }) => (
  <button
    onClick={onClick}
    className={`group relative flex items-center transition-all duration-300 rounded-2xl mb-2
      ${isCollapsed ? 'justify-center w-12 h-12 p-0' : 'w-full px-4 py-3 space-x-3'}
      ${isActive 
        ? 'bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white shadow-lg shadow-violet-500/30 backdrop-blur-md' 
        : 'text-slate-300 hover:bg-white/10 hover:text-white'}
    `}
    title={isCollapsed ? label : undefined}
  >
    <div className="relative z-10 transition-transform group-hover:scale-110">
      {icon}
    </div>
    
    {!isCollapsed && (
      <span className="relative z-10 font-medium tracking-tight text-sm">
        {label}
      </span>
    )}
    
    {/* Hover Glow */}
    {!isActive && (
        <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    )}
  </button>
);

const DashboardIcon = ({className}: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75h6.5v6.5h-6.5zM13.75 3.75h6.5v4.5h-6.5zM13.75 10.25h6.5v10h-6.5zM3.75 12.25h6.5v8h-6.5z" />
  </svg>
);

const Sidebar = ({ isOpen, isCollapsed, onClose, onNavigate, onToggleCollapse, currentView, activeAction }: SidebarProps) => {
  const { t } = useTranslation();

  const handleNavigation = (payload: { view: View; action?: string }) => {
    onNavigate(payload);
    onClose();
  }

  // --- FULL TOOL LIST RESTORED (Localized) ---
  const tools = [
    { icon: <DashboardIcon className="w-5 h-5"/>, label: t.nav_studio, view: "dashboard" as View },
    { icon: <UploadIcon className="w-5 h-5"/>, label: t.nav_upload, view: "upload" as View },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>, label: t.nav_ai_gallery, view: "ai-gallery" as View },
    { icon: <AnalysisIcon className="w-5 h-5"/>, label: t.pipeline_step_culling, view: "batch" as View, action: "culling" },
    { icon: <AutopilotIcon className="w-5 h-5"/>, label: t.pipeline_step_edit, view: "editor" as View, action: "base-edit" },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.455l.259-1.036.259 1.036a3.375 3.375 0 002.455 2.456l1.036.259-1.036.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>, label: t.gen_title, view: "generate" as View },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>, label: t.raw_title, view: "raw-converter" as View },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5a2.25 2.25 0 012.25-2.25h4.19a2.25 2.25 0 011.6.66l1.2 1.2a2.25 2.25 0 001.6.66H18.75A2.25 2.25 0 0121 10v7.5A2.25 2.25 0 0118.75 19.75H5.25A2.25 2.25 0 013 17.5v-10z" /></svg>, label: t.nav_projects, view: "projects" as View },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3 3 0 11-6 0 3 3 0 016 0zM4.5 19.5a5.25 5.25 0 0110.5 0v.75H4.5v-.75zM17.5 19.5a4.5 4.5 0 00-3.3-4.34" /></svg>, label: t.nav_clients, view: "clients" as View },
  ];

  return (
    <>
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
      
      <aside className={`
        fixed lg:relative z-50 
        transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        flex flex-col
        ${isOpen ? 'translate-x-0 w-72' : '-translate-x-[120%] lg:translate-x-0'} 
        ${isCollapsed ? 'lg:w-24' : 'lg:w-72'} 
        h-screen p-4
      `}>
        {/* Glass Container */}
        <div className="h-full w-full os-glass rounded-[2rem] flex flex-col p-4 overflow-hidden border border-white/10">
            
            {/* Header */}
            <div className={`flex items-center mb-8 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                <button onClick={() => handleNavigation({ view: 'dashboard' })} className="flex items-center space-x-3 group w-full">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex flex-shrink-0 items-center justify-center text-white shadow-lg shadow-fuchsia-500/30 group-hover:scale-105 transition-all duration-300">
                    <LogoIcon className="w-6 h-6" />
                </div>
                {!isCollapsed && (
                    <div className="flex-grow overflow-hidden text-left whitespace-nowrap">
                    <h1 className="text-lg font-bold text-white tracking-tight">Fotograf.AI</h1>
                    <p className="text-[10px] text-fuchsia-200 font-medium tracking-wide opacity-80">Vision OS</p>
                    </div>
                )}
                </button>
            </div>

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                <div className="space-y-1">
                    {tools.map((item) => {
                        const isActive = item.view === currentView && (item.action ? item.action === (activeAction?.action) : activeAction === null);
                        return (
                            <NavItem 
                                key={item.label} 
                                icon={item.icon} 
                                label={item.label} 
                                onClick={() => handleNavigation({ view: item.view, action: item.action })} 
                                isActive={isActive} 
                                isCollapsed={isCollapsed}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Footer / Collapse */}
            <div className="mt-4 pt-4 border-t border-white/10">
                <button onClick={onToggleCollapse} className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <ChevronDoubleLeftIcon className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                </button>
            </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;