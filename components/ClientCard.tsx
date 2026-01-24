import React from 'react';
import type { Client } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface ClientCardProps {
  client: Client;
  projectCount: number;
  onOpen: () => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, projectCount, onOpen }) => {
  const { t } = useTranslation();

  return (
    <div className="group bg-slate-900/40 border border-white/5 rounded-3xl p-6 transition-all hover:border-cyan-500/40 hover:shadow-[0_0_45px_-20px_rgba(34,211,238,0.6)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">{client.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{client.email}</p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full border border-white/10 text-slate-300 bg-white/5">
          {projectCount} {t.crm_projects}
        </span>
      </div>

      <button
        onClick={onOpen}
        className="mt-6 w-full py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm font-semibold text-slate-200 hover:bg-cyan-500/10 hover:border-cyan-400/40 transition-colors"
      >
        {t.crm_open_client}
      </button>
    </div>
  );
};

export default ClientCard;
