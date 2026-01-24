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
      <label className="text-xs uppercase tracking-[0.2em] text-text-secondary font-semibold">
        {t.crm_client}
      </label>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 bg-surface/60 border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
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
          className="px-4 py-2 rounded-xl bg-elevated border border-border-subtle text-xs font-semibold text-text-primary hover:bg-accent/10 hover:border-accent/40 transition-colors"
        >
          {t.crm_new_client_short}
        </button>
      </div>
    </div>
  );
};

export default ClientSelector;


