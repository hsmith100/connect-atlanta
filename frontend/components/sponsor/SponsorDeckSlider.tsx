import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SponsorDeckSliderProps {
  images: string[]
  onOpenModal: (index: number) => void
}

export default function SponsorDeckSlider({ images, onOpenModal }: SponsorDeckSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [images.length])

  const next = () => setCurrentSlide(prev => (prev + 1) % images.length)
  const prev = () => setCurrentSlide(prev => (prev - 1 + images.length) % images.length)

  return (
    <div className="pb-4">
      <div className="section-container max-w-6xl">
        <div className="relative max-w-5xl mx-auto">
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl bg-black border-2 border-brand-primary/20">
            {images.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 cursor-pointer ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => onOpenModal(index)}
              >
                <Image
                  src={img}
                  alt={`Sponsor Deck Page ${index + 1}`}
                  fill
                  className="object-contain p-2"
                  priority={index === 0}
                />
              </div>
            ))}

            <button
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle bg-black/40 hover:bg-black/60 border-2 border-white/20 hover:border-white/40 shadow-lg z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle bg-black/40 hover:bg-black/60 border-2 border-white/20 hover:border-white/40 shadow-lg z-10"
              aria-label="Next slide"
            >
              <ChevronRight size={24} className="text-white" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentSlide(index) }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? 'bg-brand-primary w-8' : 'bg-gray-400/40 hover:bg-gray-400/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="text-center mt-4 text-brand-text font-semibold">
            Page {currentSlide + 1} of {images.length}
          </div>
        </div>
      </div>
    </div>
  )
}
