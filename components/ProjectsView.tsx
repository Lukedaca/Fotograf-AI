import React, { useMemo, useState } from 'react';
import Header from './Header';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';
import ClientModal from './ClientModal';
import { useProject } from '../contexts/ProjectContext';
import { useTranslation } from '../contexts/LanguageContext';
import type { ProjectStatus } from '../types';

interface ProjectsViewProps {
  title: string;
  onToggleSidebar: () => void;
  onOpenProject: (id: string) => void;
  onStartUploadForProject: (id: string) => void;
  onOpenApiKeyModal?: () => void;
}

const statusFilters = [
  { id: 'all', labelKey: 'crm_filter_all' },
  { id: 'draft', labelKey: 'status_draft' },
  { id: 'editing', labelKey: 'status_editing' },
  { id: 'review', labelKey: 'status_review' },
  { id: 'delivered', labelKey: 'status_delivered' },
] as const;

const ProjectsView: React.FC<ProjectsViewProps> = ({ title, onToggleSidebar, onOpenProject, onStartUploadForProject, onOpenApiKeyModal }) => {
  const { t } = useTranslation();
  const { projects, clients, addProject, addClient } = useProject();
  const [filter, setFilter] = useState<'all' | ProjectStatus>('all');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    if (filter === 'all') return projects;
    return projects.filter((project) => project.status === filter);
  }, [filter, projects]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar">
      <Header title={title} onToggleSidebar={onToggleSidebar} onOpenApiKeyModal={onOpenApiKeyModal} />

      <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white">{t.crm_projects_title}</h2>
            <p className="text-sm text-slate-500">{t.crm_projects_desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:border-cyan-500/40"
            >
              {t.crm_new_client_short}
            </button>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-sm font-semibold text-white shadow-lg"
            >
              {t.crm_new_project}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === item.id
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-cyan-500/40'
              }`}
            >
              {t[item.labelKey as keyof typeof t]}
            </button>
          ))}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-12 text-center text-slate-500">
            {t.crm_no_projects}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                client={clients.find((client) => client.id === project.clientId)}
                onOpen={() => onOpenProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={isProjectModalOpen}
        clients={clients}
        onClose={() => setIsProjectModalOpen(false)}
        onCreate={(payload) => {
          const newProject = addProject(payload);
          onStartUploadForProject(newProject.id);
        }}
        onCreateClientRequest={() => {
          setIsProjectModalOpen(false);
          setIsClientModalOpen(true);
        }}
      />

      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onCreate={(client) => addClient(client)}
      />
    </div>
  );
};

export default ProjectsView;
