import React, { useMemo, useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useTranslation } from '../contexts/LanguageContext';

interface GalleryPreviewViewProps {
  projectId: string;
}

const GalleryPreviewView: React.FC<GalleryPreviewViewProps> = ({ projectId }) => {
  const { t } = useTranslation();
  const { projects } = useProject();
  const project = useMemo(() => projects.find((item) => item.id === projectId), [projects, projectId]);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<{ id: string; text: string; createdAt: string }[]>([]);

  useEffect(() => {
    const key = `fotograf_gallery_comments_${projectId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setComments(JSON.parse(stored));
      } catch {
        setComments([]);
      }
    }
  }, [projectId]);

  useEffect(() => {
    const key = `fotograf_gallery_comments_${projectId}`;
    localStorage.setItem(key, JSON.stringify(comments));
  }, [comments, projectId]);

  if (!project) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center text-text-secondary">
        {t.crm_gallery_missing}
      </div>
    );
  }

  const selectedIds = project.gallery.selectedFileIds.length > 0 ? project.gallery.selectedFileIds : project.files.map((file) => file.id);
  const visibleFiles = project.files.filter((file) => selectedIds.includes(file.id));

  return (
    <div className="min-h-screen bg-void text-text-primary">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">{project.name}</h1>
            <p className="text-sm text-text-secondary">{t.crm_gallery_title}</p>
          </div>
          {project.gallery.allowDownload && (
            <button className="px-5 py-2 bg-elevated border border-border-subtle text-xs font-semibold text-text-primary">
              {t.crm_download_all}
            </button>
          )}
        </div>

        {visibleFiles.length === 0 ? (
          <div className="bg-surface/40 border border-border-subtle p-12 text-center text-text-secondary">
            {t.crm_gallery_empty}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleFiles.map((file) => (
              <div key={file.id} className="aspect-[4/3] overflow-hidden border border-border-subtle">
                <img src={file.previewUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="bg-surface/40 border border-border-subtle p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Komentáře</h3>
            <span className="text-xs text-text-secondary">{comments.length} celkem</span>
          </div>
          <div className="space-y-3">
            {comments.length === 0 && (
              <div className="text-sm text-text-secondary">Zatím bez komentářů.</div>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="border border-border-subtle bg-black/30 p-4 text-sm text-text-primary">
                <div className="text-[10px] text-text-secondary mb-1">{new Date(comment.createdAt).toLocaleString()}</div>
                {comment.text}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <textarea
              rows={3}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Zanechte zpětnou vazbu fotografovi..."
              className="w-full bg-void border border-border-subtle px-4 py-3 text-sm text-text-primary outline-none"
            />
            <button
              onClick={() => {
                if (!commentInput.trim()) return;
                setComments((prev) => [
                  { id: `${Date.now()}`, text: commentInput.trim(), createdAt: new Date().toISOString() },
                  ...prev,
                ]);
                setCommentInput('');
              }}
              className="self-end px-4 py-2 text-xs font-bold bg-accent text-void border border-accent"
            >
              Přidat komentář
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryPreviewView;


