import React from 'react';
import type { Project } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

interface GallerySettingsPanelProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

const GallerySettingsPanel: React.FC<GallerySettingsPanelProps> = ({ project, onUpdate }) => {
  const { t } = useTranslation();

  const selectedCount = project.gallery.selectedFileIds.length;
  const totalFiles = project.files.length;

  const handleTogglePublish = () => {
    const nextPublished = !project.gallery.published;
    const link = nextPublished
      ? project.gallery.link || `https://foto.app/g/${project.id.slice(-6)}`
      : undefined;

    onUpdate({
      gallery: {
        ...project.gallery,
        published: nextPublished,
        link,
      },
    });
  };

  const handleSelectAll = () => {
    const allIds = project.files.map((file) => file.id);
    onUpdate({
      gallery: {
        ...project.gallery,
        selectedFileIds: allIds,
      },
    });
  };

  const handleClearSelection = () => {
    onUpdate({
      gallery: {
        ...project.gallery,
        selectedFileIds: [],
      },
    });
  };

  return (
    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{t.crm_gallery_settings}</h3>
          <p className="text-xs text-slate-500">{t.crm_gallery_settings_desc}</p>
        </div>
        <button
          onClick={handleTogglePublish}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
            project.gallery.published
              ? 'bg-green-500/10 border-green-500/40 text-green-300'
              : 'bg-white/5 border-white/10 text-slate-300'
          }`}
        >
          {project.gallery.published ? t.crm_unpublish : t.crm_publish}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span>{t.crm_selected}: {selectedCount}/{totalFiles}</span>
        <button onClick={handleSelectAll} className="px-3 py-1 rounded-full border border-white/10 hover:border-cyan-500/40">
          {t.crm_select_all}
        </button>
        <button onClick={handleClearSelection} className="px-3 py-1 rounded-full border border-white/10 hover:border-cyan-500/40">
          {t.crm_clear_selection}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={project.gallery.allowDownload}
            onChange={(event) =>
              onUpdate({
                gallery: { ...project.gallery, allowDownload: event.target.checked },
              })
            }
          />
          {t.crm_allow_download}
        </label>
      </div>

      {project.gallery.published && project.gallery.link && (
        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-cyan-300 break-all">
          {project.gallery.link}
        </div>
      )}
    </div>
  );
};

export default GallerySettingsPanel;
