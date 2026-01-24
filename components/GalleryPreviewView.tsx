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

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Comments</h3>
            <span className="text-xs text-slate-500">{comments.length} total</span>
          </div>
          <div className="space-y-3">
            {comments.length === 0 && (
              <div className="text-sm text-slate-500">No comments yet.</div>
            )}
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200">
                <div className="text-[10px] text-slate-500 mb-1">{new Date(comment.createdAt).toLocaleString()}</div>
                {comment.text}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <textarea
              rows={3}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Leave feedback for the photographer..."
              className="w-full rounded-xl bg-slate-950 border border-white/10 px-4 py-3 text-sm text-slate-100 outline-none"
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
              className="self-end px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-white"
            >
              Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryPreviewView;
