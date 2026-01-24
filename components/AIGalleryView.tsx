import React, { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import { useTranslation } from '../contexts/LanguageContext';
import { useProject } from '../contexts/ProjectContext';
import type { AIGalleryAsset, AIGalleryType, UploadedFile } from '../types';
import { deleteAIGalleryAsset, listAIGalleryAssets } from '../utils/aiGallery';

interface AIGalleryViewProps {
  title: string;
  onToggleSidebar: () => void;
  onOpenApiKeyModal?: () => void;
  credits?: number;
  onBuyCredits?: () => void;
}

const typeLabels: Record<AIGalleryType, string> = {
  generate: 'Generate',
  autopilot: 'Autopilot',
  'youtube-thumbnail': 'YouTube',
};

const AIGalleryView: React.FC<AIGalleryViewProps> = ({ title, onToggleSidebar, onOpenApiKeyModal, credits, onBuyCredits }) => {
  const { t } = useTranslation();
  const { projects, updateProject } = useProject();
  const [items, setItems] = useState<AIGalleryAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AIGalleryType | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const list = await listAIGalleryAssets();
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setItems(list);
      } catch (e) {
        console.error('Failed to load AI gallery', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const urls: Record<string, string> = {};
    items.forEach((item) => {
      urls[item.id] = URL.createObjectURL(item.blob);
    });
    setPreviewUrls(urls);
    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (!q) return true;
      const haystack = `${item.fileName} ${item.prompt || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query, typeFilter]);

  const selectedItem = selectedId ? items.find((item) => item.id === selectedId) || null : null;

  const handleDelete = async (id: string) => {
    try {
      await deleteAIGalleryAsset(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (e) {
      console.error('Failed to delete AI gallery item', e);
    }
  };

  const handleDownload = (item: AIGalleryAsset) => {
    const url = URL.createObjectURL(item.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.fileName || `ai_${item.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddToProject = (item: AIGalleryAsset) => {
    if (!selectedProjectId) return;
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;
    const file = new File([item.blob], item.fileName, { type: item.mimeType });
    const previewUrl = URL.createObjectURL(file);
    const newFile: UploadedFile = {
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      previewUrl,
      originalPreviewUrl: previewUrl,
    };
    updateProject(project.id, {
      files: [...project.files, newFile],
      status: 'editing',
      activity: [
        ...project.activity,
        {
          id: `a-${Date.now()}`,
          type: 'uploaded',
          timestamp: new Date().toISOString(),
          description: `AI gallery add: ${item.fileName}`,
        },
      ],
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar">
      <Header title={title} onToggleSidebar={onToggleSidebar} onOpenApiKeyModal={onOpenApiKeyModal} credits={credits} onBuyCredits={onBuyCredits} />

      <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.ai_gallery_search}
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as AIGalleryType | 'all')}
              className="bg-slate-900/60 border border-white/10 rounded-xl px-3 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              <option value="all">{t.ai_gallery_filter_all}</option>
              <option value="generate">{t.ai_gallery_filter_generate}</option>
              <option value="autopilot">{t.ai_gallery_filter_autopilot}</option>
              <option value="youtube-thumbnail">{t.ai_gallery_filter_youtube}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-slate-500 text-sm">{t.ai_gallery_loading}</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-slate-500 text-sm">{t.ai_gallery_empty}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`relative aspect-[4/3] rounded-2xl overflow-hidden border transition-all ${
                  item.id === selectedId ? 'border-cyan-500/70 ring-2 ring-cyan-500/30' : 'border-white/10'
                }`}
              >
                <img src={previewUrls[item.id]} alt={item.fileName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-2 left-2 text-[10px] px-2 py-1 rounded-full bg-black/60 text-white">
                  {typeLabels[item.type]}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedItem && (
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-slate-200 font-bold">{selectedItem.fileName}</div>
                <div className="text-xs text-slate-500">{new Date(selectedItem.createdAt).toLocaleString()}</div>
                {selectedItem.prompt && (
                  <p className="text-sm text-slate-400 mt-3">{selectedItem.prompt}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(selectedItem)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:border-cyan-500/40"
                >
                  {t.ai_gallery_download}
                </button>
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-red-500/30 text-red-300 hover:border-red-500/60"
                >
                  {t.ai_gallery_delete}
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <option value="">{t.ai_gallery_select_project}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <button
                onClick={() => handleAddToProject(selectedItem)}
                disabled={!selectedProjectId}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 text-slate-300 hover:border-cyan-500/40 disabled:opacity-50"
              >
                {t.ai_gallery_add_to_project}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIGalleryView;
