import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Photo } from '@shared/types/photos'

interface GalleryLightboxProps {
  photos: Photo[]
  selectedIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export default function GalleryLightbox({ photos, selectedIndex, onClose, onNext, onPrev }: GalleryLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNext, onPrev])

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 z-[110] text-white hover:text-brand-primary transition-colors bg-black/50 rounded-full p-3 hover:bg-black/70"
        aria-label="Close modal"
      >
        <X size={32} />
      </button>

      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 z-[110] text-white hover:text-brand-primary transition-colors bg-black/50 rounded-full p-3 hover:bg-black/70"
          aria-label="Previous image"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      <div
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photos[selectedIndex].url}
          alt={`Gallery photo ${selectedIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
          {selectedIndex + 1} / {photos.length}
        </div>
      </div>

      {photos.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-4 z-[110] text-white hover:text-brand-primary transition-colors bg-black/50 rounded-full p-3 hover:bg-black/70"
          aria-label="Next image"
        >
          <ChevronRight size={32} />
        </button>
      )}
    </div>
  )
}
