import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, ImageOff } from 'lucide-react';

export default function ImageModal({ images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [imgError, setImgError] = useState(false);

  // Reset error state when switching images
  useEffect(() => { setImgError(false); }, [index]);

  const handleImgError = useCallback(() => { setImgError(true); }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex(i => Math.min(images.length - 1, i + 1));
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [images.length, onClose]);

  const validImages = images?.filter(u => u && !u.startsWith('__FAILED')) || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white hover:text-gray-300 z-10" onClick={onClose}>
        <X className="w-6 h-6" />
      </button>

      {validImages.length > 1 && (
        <>
          <button className="absolute left-4 text-white hover:text-gray-300 z-10 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={e => { e.stopPropagation(); setIndex(i => Math.max(0, i - 1)); }}
            disabled={index === 0}>
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button className="absolute right-4 text-white hover:text-gray-300 z-10 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={e => { e.stopPropagation(); setIndex(i => Math.min(validImages.length - 1, i + 1)); }}
            disabled={index === validImages.length - 1}>
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {imgError ? (
        <div className="flex flex-col items-center gap-3 text-gray-400" onClick={e => e.stopPropagation()}>
          <ImageOff className="w-16 h-16" />
          <span className="text-sm">图片加载失败</span>
          <span className="text-xs text-gray-500">请将服务器上的图片同步到本地</span>
        </div>
      ) : (
        <img src={validImages[index]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain"
          onClick={e => e.stopPropagation()} onError={handleImgError} />
      )}

      {validImages.length > 1 && (
        <div className="absolute bottom-4 text-gray-400 text-sm">
          {index + 1} / {validImages.length}
        </div>
      )}
    </div>
  );
}
