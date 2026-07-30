import { useState, useEffect } from 'react';

export default function ImageModal({ images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);

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
      <button className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10" onClick={onClose}>&times;</button>

      {validImages.length > 1 && (
        <>
          <button className="absolute left-4 text-white text-3xl hover:text-gray-300 z-10"
            onClick={e => { e.stopPropagation(); setIndex(i => Math.max(0, i - 1)); }}
            disabled={index === 0}>&lsaquo;</button>
          <button className="absolute right-4 text-white text-3xl hover:text-gray-300 z-10"
            onClick={e => { e.stopPropagation(); setIndex(i => Math.min(validImages.length - 1, i + 1)); }}
            disabled={index === validImages.length - 1}>&rsaquo;</button>
        </>
      )}

      <img src={validImages[index]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={e => e.stopPropagation()} />

      {validImages.length > 1 && (
        <div className="absolute bottom-4 text-gray-400 text-sm">
          {index + 1} / {validImages.length}
        </div>
      )}
    </div>
  );
}
