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
    <div className="bg-surface/40 border border-border-subtle rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{t.crm_gallery_settings}</h3>
          <p className="text-xs text-text-secondary">{t.crm_gallery_settings_desc}</p>
        </div>
        <button
          onClick={handleTogglePublish}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
            project.gallery.published
              ? 'bg-success/10 border-success/40 text-success'
              : 'bg-elevated border-border-subtle text-text-primary'
          }`}
        >
          {project.gallery.published ? t.crm_unpublish : t.crm_publish}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
        <span>{t.crm_selected}: {selectedCount}/{totalFiles}</span>
        <button onClick={handleSelectAll} className="px-3 py-1 rounded-full border border-border-subtle hover:border-accent/40">
          {t.crm_select_all}
        </button>
        <button onClick={handleClearSelection} className="px-3 py-1 rounded-full border border-border-subtle hover:border-accent/40">
          {t.crm_clear_selection}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-text-primary">
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
        <div className="bg-black/40 border border-border-subtle rounded-2xl p-4 text-xs text-accent break-all">
          {project.gallery.link}
        </div>
      )}
    </div>
  );
};

export default GallerySettingsPanel;


