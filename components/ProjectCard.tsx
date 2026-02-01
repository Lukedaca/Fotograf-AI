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
    <div className="group bg-surface/40 border border-border-subtle rounded-3xl p-6 transition-all hover:border-accent/40 hover:shadow-[0_0_45px_-20px_rgba(34,211,238,0.6)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">{project.name}</h3>
          <p className="text-xs text-text-secondary mt-1">{client ? client.name : t.crm_unknown_client}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-text-secondary">
        <span>{t.crm_project_date}: {project.date}</span>
        <span>{t.crm_files}: {project.files.length}</span>
      </div>

      <button
        onClick={onOpen}
        className="mt-6 w-full py-2.5 rounded-xl bg-elevated border border-border-subtle text-sm font-semibold text-text-primary hover:bg-accent/10 hover:border-accent/40 transition-colors"
      >
        {t.crm_open_project}
      </button>
    </div>
  );
};

export default ProjectCard;


