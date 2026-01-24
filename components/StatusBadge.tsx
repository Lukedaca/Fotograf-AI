import React from 'react';
import type { ProjectStatus } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

const statusColors: Record<ProjectStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  editing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const { t } = useTranslation();
  const labels: Record<ProjectStatus, string> = {
    draft: t.status_draft,
    editing: t.status_editing,
    review: t.status_review,
    delivered: t.status_delivered,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full border ${statusColors[status]}`}
    >
      {labels[status]}
    </span>
  );
};

export default StatusBadge;
