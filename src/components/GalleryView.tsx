import React, { useState } from 'react';
import { Image as ImageIcon, Plus, Upload, Trash, Check, Compass, Calendar, User } from 'lucide-react';
import { GalleryItem, User as UserType } from '../types';

interface GalleryViewProps {
  currentUser: UserType;
  gallery: GalleryItem[];
  onUploadGalleryItem: (itemData: {
    title: string;
    url: string;
    type: 'image' | 'video';
  }) => Promise<void>;
  onOpenLightbox?: (url: string, caption?: string) => void;
}

export default function GalleryView({
  currentUser,
  gallery,
  onUploadGalleryItem,
  onOpenLightbox
}: GalleryViewProps) {
  const [showUploader, setShowUploader] = useState(false);
  const [title, setTitle] = useState('');
  const [attachedUrl, setAttachedUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // File Upload base64 translation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.75);
          setAttachedUrl(compressedUrl);
        } else {
          setAttachedUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !attachedUrl) return;

    setIsUploading(true);
    try {
      await onUploadGalleryItem({
        title,
        url: attachedUrl,
        type: 'image'
      });
      setTitle('');
      setAttachedUrl('');
      setShowUploader(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-grow space-y-6" id="gallery-module">
      
      {/* Header section with Trigger */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <ImageIcon className="h-5 w-5 text-blue-900 dark:text-blue-400" />
            <span>Maretraite Project Gallery</span>
          </h1>
          <p className="text-xs text-slate-400">Preserving memories of traditional Suriname food festivals, security upgrades, and voluntary assemblies</p>
        </div>

        <button
          onClick={() => setShowUploader(!showUploader)}
          className="bg-blue-900 hover:bg-blue-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center space-x-1.5 shadow-md shadow-blue-900/10"
          id="upload-gallery-photo-btn"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Site Photo</span>
        </button>
      </div>

      {showUploader && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-all max-w-lg mx-auto">
          <div className="pb-3 border-b mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Upload Community Memory</h3>
            <span className="text-[10px] text-slate-400">Share project site photos or local memories instantly with your neighbors.</span>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Photo Title*</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Road Paving completed Sector 2 intersection"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-250"
                id="gallery-title-input"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Select Photo File*</label>
              <div className="flex items-center justify-center border-2 border-dashed rounded-2xl p-6 bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-805">
                {attachedUrl ? (
                  <div className="text-center">
                    <img src={attachedUrl} className="max-h-40 rounded mx-auto mb-2.5 object-cover" />
                    <button
                      type="button"
                      onClick={() => setAttachedUrl('')}
                      className="text-xs text-red-500 font-bold underline"
                    >
                      Clear File
                    </button>
                  </div>
                ) : (
                  <label className="text-center cursor-pointer block">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                    <span className="text-xs text-blue-900 dark:text-blue-400 font-bold block mt-2">Click to select physical file</span>
                    <span className="text-[10px] text-slate-400">Supports JPEG, png, and static webp assets</span>
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                disabled={isUploading || !title || !attachedUrl}
                className="flex-grow bg-blue-900 disabled:opacity-45 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                id="upload-gallery-submit"
              >
                {isUploading ? 'Uploading...' : 'Publish Photo to Gallery'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploader(false);
                  setTitle('');
                  setAttachedUrl('');
                }}
                className="px-4 py-2.5 border text-xs text-slate-500 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gallery Photo Grids showcase */}
      {gallery.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-400">No community gallery snapshots available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gallery.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col transition-colors group hover:shadow-md"
              id={`gallery-item-${item.id}`}
            >
              <div className="relative h-56 bg-slate-100 dark:bg-slate-950 overflow-hidden">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                  onClick={() => onOpenLightbox?.(item.url, item.title)}
                />
              </div>

              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug truncate">
                    {item.title}
                  </h3>
                </div>

                <div className="mt-3.5 pt-3 border-t text-[10px] text-slate-400 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                  <div className="flex items-center space-x-1.5">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>by {item.uploadedBy}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
