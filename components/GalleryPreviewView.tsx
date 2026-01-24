import React, { useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useTranslation } from '../contexts/LanguageContext';

interface GalleryPreviewViewProps {
  projectId: string;
}

const GalleryPreviewView: React.FC<GalleryPreviewViewProps> = ({ projectId }) => {
  const { t } = useTranslation();
  const { projects } = useProject();
  const project = useMemo(() => projects.find((item) => item.id === projectId), [projects, projectId]);

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        {t.crm_gallery_missing}
      </div>
    );
  }

  const selectedIds = project.gallery.selectedFileIds.length > 0 ? project.gallery.selectedFileIds : project.files.map((file) => file.id);
  const visibleFiles = project.files.filter((file) => selectedIds.includes(file.id));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">{project.name}</h1>
            <p className="text-sm text-slate-500">{t.crm_gallery_title}</p>
          </div>
          {project.gallery.allowDownload && (
            <button className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
              {t.crm_download_all}
            </button>
          )}
        </div>

        {visibleFiles.length === 0 ? (
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-12 text-center text-slate-500">
            {t.crm_gallery_empty}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleFiles.map((file) => (
              <div key={file.id} className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10">
                <img src={file.previewUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPreviewView;
