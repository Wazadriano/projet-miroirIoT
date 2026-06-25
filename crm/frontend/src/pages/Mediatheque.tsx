import { useState, useCallback, useRef } from 'react';
import { useMedias, useInvalidate } from '@/lib/hooks';
import { api } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { Plus, Trash2, GripVertical, Image, SquarePlay, Link, X, Check, AlertTriangle, ZoomIn, Upload, FileVideo } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { Media } from '@/lib/types';

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w\-]{11})/);
  return m ? m[1] : null;
}

/* ── Add media modal ───────────────────────────────────────────── */
function AddModal({ onClose, onUploadDone }: { onClose: () => void; onUploadDone: () => void }) {
  const invalidate = useInvalidate();
  const [tab, setTab] = useState<'file' | 'youtube'>('file');
  const [uploading, setUploading] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const [ytName, setYtName] = useState('');
  const [ytLoading, setYtLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('fichier', file);
      fd.append('type', file.type.startsWith('video') ? 'video' : 'image');
      await api('medias', { method: 'POST', body: fd });
    }
    setUploading(false);
    invalidate('medias');
    onUploadDone();
    onClose();
  };

  const handleAddYoutube = async () => {
    if (!ytUrl.trim()) return;
    setYtLoading(true);
    await api('medias', {
      method: 'POST',
      body: JSON.stringify({ url_youtube: ytUrl.trim(), nom_affichage: ytName.trim() || undefined }),
    });
    setYtLoading(false);
    invalidate('medias');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1c1412] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-white/5">
          <h3 className="font-semibold text-base">Ajouter un média</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-white/5">
          <button
            onClick={() => setTab('file')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${tab === 'file'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
          >
            <FileVideo className="w-4 h-4" /> Photo / Vidéo
          </button>
          <button
            onClick={() => setTab('youtube')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${tab === 'youtube'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
          >
            <SquarePlay className="w-4 h-4" /> YouTube
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {tab === 'file' ? (
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={`w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-8 flex flex-col items-center gap-3 text-gray-400 hover:border-primary/50 hover:text-primary transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">{uploading ? 'Upload en cours…' : 'Cliquez pour choisir des fichiers'}</span>
                <span className="text-xs">Images et vidéos acceptées · max 200 Mo</span>
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5 font-medium">URL YouTube</label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 focus-within:border-primary transition-colors">
                  <Link className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="url"
                    value={ytUrl}
                    onChange={e => setYtUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddYoutube()}
                    placeholder="https://www.youtube.com/watch?v=…"
                    className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5 font-medium">Nom d&apos;affichage <span className="font-normal text-gray-400">(optionnel — titre YouTube par défaut)</span></label>
                <input
                  type="text"
                  value={ytName}
                  onChange={e => setYtName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddYoutube()}
                  placeholder="Ex : Promo printemps"
                  className="input"
                />
              </div>
              <button
                onClick={handleAddYoutube}
                disabled={ytLoading || !ytUrl.trim()}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> {ytLoading ? 'Ajout en cours…' : 'Ajouter la vidéo'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Delete confirmation modal ─────────────────────────────────── */
function DeleteModal({ media, onConfirm, onCancel }: {
  media: Media;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-[#1c1412] rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Supprimer ce média ?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-all">
              « {media.nom_affichage} »
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Cette action est irréversible.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn-secondary">Annuler</button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Preview / lightbox modal ──────────────────────────────────── */
function PreviewModal({ media, apiUrl, onClose }: {
  media: Media;
  apiUrl: string;
  onClose: () => void;
}) {
  const videoId = media.type === 'youtube' && media.url_youtube ? extractYoutubeId(media.url_youtube) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex flex-col items-center gap-3 max-w-5xl w-full">
        <button
          onClick={onClose}
          className="self-end text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
          {media.type === 'image' ? (
            <img
              src={`${apiUrl}/storage/${media.chemin_fichier}`}
              alt={media.nom_affichage}
              className="max-h-[80vh] w-full object-contain"
            />
          ) : media.type === 'youtube' && videoId ? (
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={media.nom_affichage}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <video
              src={`${apiUrl}/storage/${media.chemin_fichier}`}
              controls
              autoPlay
              className="max-h-[80vh] w-full"
            />
          )}
        </div>
        <p className="text-white/80 text-sm text-center">{media.nom_affichage}</p>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function Mediatheque() {
  const { data: medias, isLoading } = useMedias();
  const invalidate = useInvalidate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null);
  const [previewItem, setPreviewItem] = useState<Media | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await api(`medias/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    invalidate('medias');
  };

  const handleToggle = async (m: Media) => {
    await api(`medias/${m.id}`, { method: 'PUT', body: JSON.stringify({ actif: !m.actif }) });
    invalidate('medias');
  };

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || !medias) return;
    const items = Array.from(medias);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    await api('medias/reorder', { method: 'PATCH', body: JSON.stringify({ ids: items.map((m) => m.id) }) });
    invalidate('medias');
  }, [medias, invalidate]);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  const typeLabel: Record<string, string> = { image: 'Photo', video: 'Vidéo', youtube: 'YouTube' };
  const typeBg: Record<string, string> = {
    image: 'bg-primary/15 text-primary-deeper',
    video: 'bg-primary/30 text-primary-deeper',
    youtube: 'bg-[#c5907b]/20 text-[#a67b66]',
  };

  return (
    <div>
      <PageHeader
        title="Médiathèque"
        subtitle={`${medias?.length ?? 0} médias`}
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Chargement…</div>
      ) : !medias?.length ? (
        <div className="card text-center py-16 text-gray-400">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="mb-4">Aucun média pour l&apos;instant.</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary inline-flex items-center gap-1.5 mx-auto">
            <Plus className="w-4 h-4" /> Ajouter un média
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="medias">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {medias.map((m: Media, i: number) => {
                  const videoId = m.type === 'youtube' && m.url_youtube ? extractYoutubeId(m.url_youtube) : null;
                  return (
                    <Draggable key={m.id} draggableId={m.id} index={i}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          onClick={() => setPreviewItem(m)}
                          className={`card flex items-center gap-3 !p-3 cursor-pointer hover:shadow-md transition-shadow ${snap.isDragging ? 'shadow-lg' : ''}`}
                        >
                          <div
                            {...prov.dragHandleProps}
                            onClick={e => e.stopPropagation()}
                            className="text-gray-300 cursor-grab shrink-0"
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>

                          {/* Thumbnail */}
                          <div className="group relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {m.type === 'image' ? (
                              <img src={`${apiUrl}/storage/${m.chemin_fichier}`} alt={m.nom_affichage} className="w-full h-full object-cover" />
                            ) : m.type === 'youtube' && videoId ? (
                              <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt={m.nom_affichage} className="w-full h-full object-cover" />
                            ) : (
                              <video
                                src={`${apiUrl}/storage/${m.chemin_fichier}`}
                                preload="metadata"
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                                onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 1; }}
                              />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn className="w-5 h-5 text-white" />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{m.nom_affichage}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeBg[m.type] ?? ''}`}>
                                {typeLabel[m.type] ?? m.type}
                              </span>
                              <span className="text-xs text-gray-400">#{m.ordre_affichage}</span>
                            </div>
                          </div>

                          <button onClick={e => { e.stopPropagation(); handleToggle(m); }} className={`badge cursor-pointer shrink-0 ${m.actif ? 'badge-success' : 'badge-gray'}`}>
                            {m.actif ? 'Actif' : 'Inactif'}
                          </button>
                          <button onClick={e => { e.stopPropagation(); setDeleteTarget(m); }} className="p-2 text-gray-400 hover:text-danger shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddModal
          onClose={() => setShowAddModal(false)}
          onUploadDone={() => invalidate('medias')}
        />
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          media={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Preview lightbox */}
      {previewItem && (
        <PreviewModal
          media={previewItem}
          apiUrl={apiUrl}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}
