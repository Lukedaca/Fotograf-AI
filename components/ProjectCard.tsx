import React from 'react';
import type { Client, Project } from '../types';
import StatusBadge from './StatusBadge';
import { useTranslation } from '../contexts/LanguageContext';

interface ProjectCardProps {
  project: Project;
  client?: Client;
  onOpen: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, client, onOpen }) => {
  const { t } = useTranslation();

  return (
    <div className="group bg-slate-900/40 border border-white/5 rounded-3xl p-6 transition-all hover:border-cyan-500/40 hover:shadow-[0_0_45px_-20px_rgba(34,211,238,0.6)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">{project.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{client ? client.name : t.crm_unknown_client}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
        <span>{t.crm_project_date}: {project.date}</span>
        <span>{t.crm_files}: {project.files.length}</span>
      </div>

      <button
        onClick={onOpen}
        className="mt-6 w-full py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm font-semibold text-slate-200 hover:bg-cyan-500/10 hover:border-cyan-400/40 transition-colors"
      >
        {t.crm_open_project}
      </button>
    </div>
  );
};

export default ProjectCard;
