import React from 'react';
import type { ProjectStatus } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

const statusColors: Record<ProjectStatus, string> = {
  draft: 'bg-elevated text-text-secondary border-border-subtle',
  editing: 'bg-accent/20 text-accent border-accent/30',
  review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  delivered: 'bg-success/20 text-success border-success/30',
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



