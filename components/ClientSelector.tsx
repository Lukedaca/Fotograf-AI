import React from 'react';
import type { Client } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface ClientSelectorProps {
  clients: Client[];
  value: string;
  onChange: (value: string) => void;
  onCreateRequest: () => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ clients, value, onChange, onCreateRequest }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
        {t.crm_client}
      </label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        >
          <option value="">{t.crm_select_client}</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onCreateRequest}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-colors"
        >
          {t.crm_new_client_short}
        </button>
      </div>
    </div>
  );
};

export default ClientSelector;
