import React, { useEffect, useState } from 'react';
import type { Client } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (client: Omit<Client, 'id' | 'createdAt'>) => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onCreate }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onCreate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-surface border border-border-subtle rounded-[2.5rem] overflow-hidden shadow-2xl">
        <form onSubmit={handleSubmit} className="p-8 lg:p-10 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">{t.crm_new_client}</h2>
              <p className="text-sm text-text-secondary">{t.crm_new_client_desc}</p>
            </div>
            <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary">
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-text-secondary font-semibold">
              {t.crm_client_name}
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full bg-surface/60 border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder={t.crm_client_name_placeholder}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-text-secondary font-semibold">
                {t.crm_email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-surface/60 border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="email@klient.cz"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-text-secondary font-semibold">
                {t.crm_phone}
              </label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full bg-surface/60 border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="+420 777 123 456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.2em] text-text-secondary font-semibold">
              {t.crm_notes}
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full min-h-[90px] bg-surface/60 border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder={t.crm_notes_placeholder}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary">
              {t.crm_cancel}
            </button>
            <button type="submit" className="px-6 py-2.5 border border-accent bg-accent text-sm font-semibold text-void transition-none">
              {t.crm_create_client}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;


