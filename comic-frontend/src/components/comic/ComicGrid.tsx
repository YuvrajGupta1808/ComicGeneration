import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ComicGridProps {
  images: string[];
}

const ComicGrid: React.FC<ComicGridProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleImageClick = (image: string, index: number) => {
    setSelectedImage(image);
    setSelectedIndex(index);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setSelectedIndex(null);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedImage]);

  if (!images || images.length === 0) {
    return null;
  }

  // Map images to grid positions based on the bento box layout
  const gridItems = [
    { span: 'col-span-3 row-span-10', image: images[0] },
    { span: 'col-span-1 row-span-5', image: images[1] },
    { span: 'col-span-2 row-span-5', image: images[2] },
    { span: 'col-span-3 row-span-3', image: images[5] },
    { span: 'col-span-3 row-span-3', image: images[6] },
    { span: 'col-span-2 row-span-5', image: images[3] },
    { span: 'col-span-1 row-span-5', image: images[4] },
    { span: 'col-span-3 row-span-3', image: images[7] },
  ];

  return (
    <>
      <div className="w-full max-w-5xl mx-auto my-6">
        <div className="grid gap-3 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900 p-3 grid-cols-9 grid-rows-10 rounded-2xl shadow-xl" style={{ aspectRatio: '13/7' }}>
          {gridItems.map((item, index) => (
            item.image ? (
              <div
                key={index}
                onClick={() => handleImageClick(item.image, index)}
                className={`${item.span} bg-white dark:bg-neutral-950 rounded-xl shadow-lg overflow-hidden border-2 border-gray-300 dark:border-neutral-700 hover:scale-[1.02] transition-transform cursor-pointer`}
              >
                <img
                  src={item.image}
                  alt={`Panel ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div
                key={index}
                className={`${item.span} bg-gray-200 dark:bg-neutral-800 rounded-xl shadow-md flex items-center justify-center border-2 border-dashed border-gray-400 dark:border-neutral-600`}
              >
                <p className="text-gray-500 dark:text-neutral-500 text-sm">Panel {index + 1}</p>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all hover:scale-110 group z-10"
            aria-label="Close"
          >
            <X className="w-7 h-7 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Panel Info */}
          <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full z-10">
            <span className="text-white text-sm font-semibold">
              Panel {selectedIndex !== null ? selectedIndex + 1 : ''}
            </span>
          </div>

          {/* Image */}
          <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
            <img
              src={selectedImage}
              alt={`Panel ${selectedIndex !== null ? selectedIndex + 1 : ''} - Full size`}
              className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-white text-xs">Click outside or press ESC to close</span>
          </div>
        </div>
      )}
    </>
  );
};

export default ComicGrid;
