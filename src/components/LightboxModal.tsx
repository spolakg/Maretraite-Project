import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react';

interface LightboxModalProps {
  imageUrl: string;
  caption?: string;
  onClose: () => void;
}

export default function LightboxModal({
  imageUrl,
  caption,
  onClose
}: LightboxModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleZoomToggle = () => {
    setIsZoomed(!isZoomed);
    setPosition({ x: 0, y: 0 }); // Reset positions on zoom changes
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isZoomed) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      id="global-lightbox-overlay"
    >
      {/* Top action controls bar */}
      <div className="absolute top-4 right-4 z-[110] flex items-center space-x-2 bg-slate-900/60 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-800">
        {/* Toggle Zoom button */}
        <button
          onClick={handleZoomToggle}
          title={isZoomed ? "Uitzoomen (Fit)" : "Inzoomen (Detail)"}
          className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
          id="lightbox-btn-zoom"
        >
          {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
        </button>

        {/* External Link */}
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open origineel in nieuw tabblad"
          className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
          id="lightbox-btn-external"
        >
          <ExternalLink className="h-5 w-5" />
        </a>

        {/* Download action if supported */}
        {imageUrl.startsWith('data:') ? (
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = imageUrl;
              link.download = `maretraite-attached-photo-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            title="Sla afbeelding op"
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            id="lightbox-btn-download"
          >
            <Download className="h-5 w-5" />
          </button>
        ) : (
          <a
            href={imageUrl}
            download={`maretraite-attached-photo-${Date.now()}.jpg`}
            target="_blank"
            rel="noopener noreferrer"
            title="Sla afbeelding op"
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            id="lightbox-btn-download-link"
          >
            <Download className="h-5 w-5" />
          </a>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          title="Sluiten (Esc)"
          className="p-2 hover:bg-red-500 hover:text-white text-slate-300 rounded-xl transition-colors cursor-pointer"
          id="lightbox-btn-close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Image content viewport */}
      <div 
        className="w-full flex-grow flex items-center justify-center overflow-hidden max-h-[80vh] relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={imageUrl}
          alt={caption || "Snelvoorbeeld"}
          style={{
            transform: isZoomed 
              ? `translate(${position.x}px, ${position.y}px) scale(2)` 
              : `translate(0px, 0px) scale(1)`,
            transition: isDragging ? 'none' : 'transform 0.25s ease-out'
          }}
          className="max-w-full max-h-[75vh] object-contain transition-transform"
          draggable={false}
          id="lightbox-image-element"
        />
      </div>

      {/* Caption bottom bar styling */}
      {caption && (
        <div className="mt-4 max-w-2xl text-center bg-slate-900/70 border border-slate-800 text-slate-300 text-xs px-5 py-3 rounded-2xl shadow-xl max-h-[15vh] overflow-y-auto backdrop-blur-md">
          <p className="font-semibold tracking-wide text-slate-200">
            {caption}
          </p>
        </div>
      )}

      {/* Shortcut indicator helper */}
      <p className="absolute bottom-3 text-[10px] text-slate-500 select-none">
        {isZoomed ? "Slepen om te navigeren • Klik op inzoomen icoon om te herstellen" : "Klik op overlay of 'X' om te sluiten"}
      </p>
    </div>
  );
}
