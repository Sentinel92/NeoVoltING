import React, { useState } from 'react';
import { ProjectAttachment, ElectricalProject } from '../types';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import {
  Camera,
  Image as ImageIcon,
  Tag,
  Trash2,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
  Filter,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export type PhotoCategoryTag = 'ANTES' | 'DURANTE' | 'DESPUES';

export interface GalleryPhotoItem {
  id: string;
  name: string;
  dataUrl: string;
  uploadedAt: string;
  categoryTag: PhotoCategoryTag;
  sourceReport?: string;
}

interface ProjectPhotoGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  project: ElectricalProject;
  onUpdateProjectAttachments?: (updatedAttachments: ProjectAttachment[]) => void;
}

export const ProjectPhotoGallery: React.FC<ProjectPhotoGalleryProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProjectAttachments,
}) => {
  const [activeTagFilter, setActiveTagFilter] = useState<'TODAS' | PhotoCategoryTag>('TODAS');
  const [selectedPhotoForLightbox, setSelectedPhotoForLightbox] = useState<GalleryPhotoItem | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<GalleryPhotoItem | null>(null);

  // Extract all images from project attachments and work reports
  const [localPhotos, setLocalPhotos] = useState<GalleryPhotoItem[]>(() => {
    const photos: GalleryPhotoItem[] = [];

    // 1. From project attachments
    if (project.attachments) {
      project.attachments.forEach((att, idx) => {
        if (att.type.startsWith('image/')) {
          // Default category tag heuristic or stored note
          let category: PhotoCategoryTag = 'DURANTE';
          if (att.notes === 'ANTES' || att.name.toLowerCase().includes('antes')) category = 'ANTES';
          else if (att.notes === 'DESPUES' || att.name.toLowerCase().includes('despues') || att.name.toLowerCase().includes('después')) category = 'DESPUES';
          else if (idx === 0) category = 'ANTES';

          photos.push({
            id: att.id,
            name: att.name,
            dataUrl: att.dataUrl,
            uploadedAt: att.uploadedAt,
            categoryTag: category,
            sourceReport: 'Adjunto de Proyecto',
          });
        }
      });
    }

    // 2. From work reports if available
    if (project.workReports) {
      project.workReports.forEach((wr, wrIdx) => {
        if (wr.photoPaths) {
          wr.photoPaths.forEach((pUrl, pIdx) => {
            photos.push({
              id: `wr_photo_${wrIdx}_${pIdx}_${Date.now()}`,
              name: `Foto Informe ${wrIdx + 1} (${pIdx + 1})`,
              dataUrl: pUrl,
              uploadedAt: new Date().toLocaleDateString('es-CL'),
              categoryTag: pIdx === 0 ? 'ANTES' : 'DURANTE',
              sourceReport: `Informe Técnico #${wrIdx + 1}`,
            });
          });
        }
      });
    }

    return photos;
  });

  if (!isOpen) return null;

  // Upload new photo directly to gallery
  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>, defaultTag: PhotoCategoryTag = 'DURANTE') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newPhoto: GalleryPhotoItem = {
          id: `gal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          dataUrl,
          uploadedAt: new Date().toLocaleDateString('es-CL'),
          categoryTag: defaultTag,
          sourceReport: 'Cargado en Galería de Obra',
        };

        setLocalPhotos((prev) => [newPhoto, ...prev]);

        // Sync back to project attachments if handler provided
        if (onUpdateProjectAttachments) {
          const newAtt: ProjectAttachment = {
            id: newPhoto.id,
            name: newPhoto.name,
            sizeBytes: file.size,
            type: file.type,
            dataUrl,
            uploadedAt: newPhoto.uploadedAt,
            notes: defaultTag,
          };
          onUpdateProjectAttachments([...(project.attachments || []), newAtt]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Change category tag of a photo
  const handleChangePhotoCategory = (photoId: string, newTag: PhotoCategoryTag) => {
    setLocalPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, categoryTag: newTag } : p))
    );
  };

  // Delete photo handler
  const confirmDeletePhoto = () => {
    if (!photoToDelete) return;
    setLocalPhotos((prev) => prev.filter((p) => p.id !== photoToDelete.id));
    if (onUpdateProjectAttachments) {
      const updated = (project.attachments || []).filter((a) => a.id !== photoToDelete.id);
      onUpdateProjectAttachments(updated);
    }
    setPhotoToDelete(null);
  };

  // Filter photos based on tag filter
  const filteredPhotos = localPhotos.filter((p) => {
    if (activeTagFilter === 'TODAS') return true;
    return p.categoryTag === activeTagFilter;
  });

  // Lightbox Navigation
  const currentPhotoIndex = selectedPhotoForLightbox
    ? filteredPhotos.findIndex((p) => p.id === selectedPhotoForLightbox.id)
    : -1;

  const handlePrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setSelectedPhotoForLightbox(filteredPhotos[currentPhotoIndex - 1]);
    }
  };

  const handleNextPhoto = () => {
    if (currentPhotoIndex < filteredPhotos.length - 1) {
      setSelectedPhotoForLightbox(filteredPhotos[currentPhotoIndex + 1]);
    }
  };

  const getTagBadgeStyle = (tag: PhotoCategoryTag) => {
    switch (tag) {
      case 'ANTES':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'DURANTE':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'DESPUES':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-950/80 border border-fuchsia-800/60 text-fuchsia-400 flex items-center justify-center shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Galería Fotográfica de Obra</span>
                <span className="text-[10px] bg-fuchsia-500/20 text-fuchsia-300 px-2 py-0.5 rounded-full border border-fuchsia-500/30">
                  {localPhotos.length} Fotos
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {project.code} • {project.title} ({project.client.name})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow transition-all flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              <span>Adjuntar Foto</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleUploadPhoto(e)}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tag Filter Toolbar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="text-xs font-bold text-slate-300">Etiqueta:</span>

            <button
              type="button"
              onClick={() => setActiveTagFilter('TODAS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                activeTagFilter === 'TODAS'
                  ? 'bg-fuchsia-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todas ({localPhotos.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTagFilter('ANTES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTagFilter === 'ANTES'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
              }`}
            >
              <span>🛠️ Antes</span>
              <span className="text-[10px] opacity-80">
                ({localPhotos.filter((p) => p.categoryTag === 'ANTES').length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTagFilter('DURANTE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTagFilter === 'DURANTE'
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-sky-300 border border-slate-800'
              }`}
            >
              <span>⚡ Durante</span>
              <span className="text-[10px] opacity-80">
                ({localPhotos.filter((p) => p.categoryTag === 'DURANTE').length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTagFilter('DESPUES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                activeTagFilter === 'DESPUES'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-emerald-300 border border-slate-800'
              }`}
            >
              <span>✨ Después</span>
              <span className="text-[10px] opacity-80">
                ({localPhotos.filter((p) => p.categoryTag === 'DESPUES').length})
              </span>
            </button>
          </div>
        </div>

        {/* Gallery Photos Grid */}
        <div className="p-6 flex-1 overflow-y-auto">
          {filteredPhotos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <ImageIcon className="w-8 h-8" />
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                {activeTagFilter === 'TODAS'
                  ? 'No hay fotografías registradas en este proyecto. Haz clic en "Adjuntar Foto" para registrar el estado de la obra.'
                  : `No hay fotografías categorizadas como "${activeTagFilter}".`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition-all relative"
                >
                  {/* Image Container */}
                  <div className="relative aspect-video bg-black overflow-hidden cursor-pointer" onClick={() => setSelectedPhotoForLightbox(photo)}>
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhotoForLightbox(photo);
                        }}
                        className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white p-2 rounded-xl shadow transition-transform active:scale-95"
                        title="Ver en pantalla completa"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoToDelete(photo);
                        }}
                        className="bg-rose-600 hover:bg-rose-500 text-white p-2 rounded-xl shadow transition-transform active:scale-95"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tag Badge Top Left */}
                    <div className="absolute top-2 left-2">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border backdrop-blur-md uppercase tracking-wider ${getTagBadgeStyle(photo.categoryTag)}`}>
                        {photo.categoryTag === 'ANTES' && '🛠️ Antes'}
                        {photo.categoryTag === 'DURANTE' && '⚡ Durante'}
                        {photo.categoryTag === 'DESPUES' && '✨ Después'}
                      </span>
                    </div>
                  </div>

                  {/* Photo Info & Category Changer */}
                  <div className="p-3 space-y-2 bg-slate-900">
                    <div className="text-[11px] font-bold text-slate-200 truncate" title={photo.name}>
                      {photo.name}
                    </div>

                    <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {photo.uploadedAt}
                      </span>

                      {/* Tag Switcher Selector */}
                      <select
                        value={photo.categoryTag}
                        onChange={(e) => handleChangePhotoCategory(photo.id, e.target.value as PhotoCategoryTag)}
                        className="bg-slate-950 text-slate-300 border border-slate-800 rounded-lg px-1.5 py-0.5 text-[10px] font-bold focus:outline-none focus:border-fuchsia-500"
                      >
                        <option value="ANTES">🛠️ Antes</option>
                        <option value="DURANTE">⚡ Durante</option>
                        <option value="DESPUES">✨ Después</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FULL SCREEN LIGHTBOX PREVIEW MODAL */}
      {selectedPhotoForLightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 animate-fadeIn">
          {/* Top Lightbox Header */}
          <div className="flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-black px-3 py-1 rounded-full border uppercase tracking-wider ${getTagBadgeStyle(selectedPhotoForLightbox.categoryTag)}`}>
                {selectedPhotoForLightbox.categoryTag}
              </span>
              <div>
                <h3 className="text-sm font-bold">{selectedPhotoForLightbox.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedPhotoForLightbox.sourceReport} • {selectedPhotoForLightbox.uploadedAt}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPhotoForLightbox(null)}
              className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-full shadow transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Image Display */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              src={selectedPhotoForLightbox.dataUrl}
              alt={selectedPhotoForLightbox.name}
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800"
            />

            {/* Prev & Next Buttons */}
            {currentPhotoIndex > 0 && (
              <button
                onClick={handlePrevPhoto}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-fuchsia-600 text-white p-3 rounded-full shadow-2xl border border-slate-700 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {currentPhotoIndex < filteredPhotos.length - 1 && (
              <button
                onClick={handleNextPhoto}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-fuchsia-600 text-white p-3 rounded-full shadow-2xl border border-slate-700 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Footer Lightbox */}
          <div className="flex items-center justify-between text-xs text-slate-400 z-10 max-w-xl mx-auto w-full bg-slate-900/80 p-3 rounded-2xl border border-slate-800 backdrop-blur-md">
            <span>
              Foto <strong className="text-white">{currentPhotoIndex + 1}</strong> de <strong className="text-white">{filteredPhotos.length}</strong>
            </span>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">Cambiar Etiqueta:</span>
              {(['ANTES', 'DURANTE', 'DESPUES'] as PhotoCategoryTag[]).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    handleChangePhotoCategory(selectedPhotoForLightbox.id, tag);
                    setSelectedPhotoForLightbox({ ...selectedPhotoForLightbox, categoryTag: tag });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    selectedPhotoForLightbox.categoryTag === tag
                      ? 'bg-fuchsia-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmActionDialog
        isOpen={!!photoToDelete}
        title="¿Eliminar Fotografía de Obra?"
        description={
          <>
            Estás a punto de borrar la foto <strong className="text-white">{photoToDelete?.name}</strong> de la galería del proyecto.
          </>
        }
        confirmText="Sí, Borrar Foto"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={confirmDeletePhoto}
        onClose={() => setPhotoToDelete(null)}
      />
    </div>
  );
};
