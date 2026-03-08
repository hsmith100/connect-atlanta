import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface SponsorDeckModalProps {
  images: string[]
  initialIndex: number
  onClose: () => void
}

export default function SponsorDeckModal({ images, initialIndex, onClose }: SponsorDeckModalProps) {
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex(prev => (prev + 1) % images.length)
      if (e.key === 'ArrowLeft') setIndex(prev => (prev - 1 + images.length) % images.length)
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [images.length, onClose])

  const next = () => setIndex(prev => (prev + 1) % images.length)
  const prev = () => setIndex(prev => (prev - 1 + images.length) % images.length)

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 btn btn-circle bg-white/10 hover:bg-white/20 border-white/20 z-10"
        aria-label="Close gallery"
      >
        <X size={24} className="text-white" />
      </button>

      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
        <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
          <Image
            src={images[index]}
            alt={`Sponsor Deck Page ${index + 1}`}
            fill
            className="object-contain"
          />
        </div>
      </div>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle bg-white/10 hover:bg-white/20 border-white/20"
        aria-label="Previous image"
      >
        <ChevronLeft size={32} className="text-white" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle bg-white/10 hover:bg-white/20 border-white/20"
        aria-label="Next image"
      >
        <ChevronRight size={32} className="text-white" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-lg font-semibold bg-black/50 px-4 py-2 rounded-full">
        {index + 1} / {images.length}
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-full px-4">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              i === index ? 'border-brand-primary scale-110' : 'border-white/20 hover:border-white/60'
            }`}
            aria-label={`Go to page ${i + 1}`}
          >
            <div className="relative w-full h-full">
              <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
