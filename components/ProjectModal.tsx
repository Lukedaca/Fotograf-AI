import React, { useEffect, useState } from 'react';
import type { Client, JobTemplate, Project } from '../types';
import { useTranslation } from '../contexts/LanguageContext';
import ClientSelector from './ClientSelector';

interface ProjectModalProps {
  isOpen: boolean;
  clients: Client[];
  onClose: () => void;
  onCreate: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCreateClientRequest: () => void;
  initialClientId?: string;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  clients,
  onClose,
  onCreate,
  onCreateClientRequest,
  initialClientId = '',
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState(initialClientId);
  const [type, setType] = useState<JobTemplate>('portrait');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialClientId) {
      setClientId(initialClientId);
    }
  }, [initialClientId]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDate(new Date().toISOString().slice(0, 10));
      setNotes('');
      if (!initialClientId) {
        setClientId('');
      }
      setType('portrait');
    }
  }, [isOpen, initialClientId]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !clientId || !date) return;

    onCreate({
      name: name.trim(),
      clientId,
      type,
      status: 'draft',
      date,
      notes: notes.trim() || undefined,
      files: [],
      gallery: { published: false, selectedFileIds: [], allowDownload: true },
      activity: [
        {
          id: `a-${Date.now()}`,
          type: 'created',
          timestamp: new Date().toISOString(),
          description: t.crm_activity_created,
        },
      ],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <form onSubmit={handleSubmit} className="p-8 lg:p-10 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">{t.crm_new_project}</h2>
              <p className="text-sm text-slate-500">{t.crm_new_project_desc}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
              {t.crm_project_name}
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              placeholder={t.crm_project_name_placeholder}
              required
            />
          </div>

          <ClientSelector
            clients={clients}
            value={clientId}
            onChange={setClientId}
            onCreateRequest={onCreateClientRequest}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                {t.crm_project_type}
              </label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as JobTemplate)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <option value="portrait">{t.template_portrait}</option>
                <option value="event">{t.template_event}</option>
                <option value="product">{t.template_product}</option>
                <option value="social">{t.template_social}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
                {t.crm_project_date}
              </label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">
              {t.crm_notes}
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full min-h-[100px] bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              placeholder={t.crm_notes_placeholder}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              {t.crm_cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-sm font-semibold text-white shadow-lg"
            >
              {t.crm_create_project}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
