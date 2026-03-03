import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { Camera, Loader2, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getGallery } from '../lib/api'

interface GalleryPhoto {
  id?: string;
  url: string;
  thumbnail?: string;
}

interface GalleryData {
  photos: GalleryPhoto[];
}

export default function Gallery() {
  const [galleryData, setGalleryData] = useState<GalleryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  // Load gallery on mount
  useEffect(() => {
    async function loadGallery() {
      try {
        setLoading(true)
        setError(null)
        // Fetch from main events/photos folder
        const gallery = await getGallery()
        setGalleryData(gallery as GalleryData)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load gallery:', err)
        setError('Could not load gallery. Please try again later.')
        setLoading(false)
      }
    }
    loadGallery()
  }, [])

  // Image modal handlers
  const openImageModal = (index: number) => {
    setSelectedImageIndex(index)
    document.body.style.overflow = 'hidden'
  }

  const closeImageModal = () => {
    setSelectedImageIndex(null)
    document.body.style.overflow = 'unset'
  }

  const nextImage = () => {
    if (galleryData && selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % galleryData.photos.length)
    }
  }

  const prevImage = () => {
    if (galleryData && selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + galleryData.photos.length) % galleryData.photos.length)
    }
  }

  // Keyboard navigation for image modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return

      if (e.key === 'Escape') closeImageModal()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImageIndex, galleryData])

  return (
    <>
      <SEO
        title="Event Gallery | Beats on the Beltline"
        description="Check out our vibe! Browse photos from Beats on the Beltline events."
        canonicalUrl="https://yourfestival.com/gallery"
      />

      <Header />

      <main className="pt-28 md:pt-[3.5rem]">
        {/* Hero + Gallery Section Combined */}
        <section className="py-8 md:py-12 relative overflow-hidden hero-gradient-gold">
          <div className="section-container relative z-10">
            {/* Hero Title & Subtitle */}
            <div className="text-center mb-12">
              <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black mb-8 uppercase bg-gradient-to-r from-brand-pink via-brand-peach to-brand-primary bg-clip-text text-transparent">
                Event Gallery
              </h1>
              <p className="text-2xl md:text-3xl text-brand-text font-bold max-w-4xl mx-auto">
                Check out our vibe
              </p>
            </div>

            {/* Gallery Content */}
            <div>
              {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-brand-primary" size={48} />
                <span className="ml-4 text-xl text-brand-header">Loading gallery...</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="max-w-2xl mx-auto text-center py-8">
                <div className="bg-red-100 border-2 border-red-400 rounded-lg p-6">
                  <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
                  <p className="text-red-800 mb-4">{error}</p>
                </div>
              </div>
            )}

            {/* Photos Grid */}
            {galleryData && !loading && galleryData.photos && galleryData.photos.length > 0 && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryData.photos.map((photo, index) => (
                    <div
                      key={photo.id || index}
                      className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer"
                      onClick={() => openImageModal(index)}
                    >
                      <img
                        src={photo.thumbnail || photo.url}
                        alt={`Gallery photo ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-header/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {galleryData && !loading && (!galleryData.photos || galleryData.photos.length === 0) && (
              <div className="text-center py-12">
                <Camera className="mx-auto mb-4 text-brand-primary/40" size={64} />
                <p className="text-xl text-brand-header/60">
                  No photos available yet.
                </p>
                <p className="text-brand-header/40 mt-2">
                  Check back soon!
                </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Image Modal */}
      {selectedImageIndex !== null && galleryData && galleryData.photos && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          {/* Close Button */}
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 z-[110] text-white hover:text-brand-primary transition-colors bg-black/50 rounded-full p-3 hover:bg-black/70"
            aria-label="Close modal"
          >
            <X size={32} />
          </button>

          {/* Previous Button */}
          {galleryData.photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
              className="absolute left-4 z-[110] text-white hover:text-brand-primary transition-colors bg-black/50 rounded-full p-3 hover:bg-black/70"
              aria-label="Previous image"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* Image Container */}
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryData.photos[selectedImageIndex].url}
              alt={`Gallery photo ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              {selectedImageIndex + 1} / {galleryData.photos.length}
            </div>
          </div>

          {/* Next Button */}
          {galleryData.photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
              className="absolute right-4 z-[110] text-white hover:text-brand-primary transition-colors bg-black/50 rounded-full p-3 hover:bg-black/70"
              aria-label="Next image"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      )}

      <Footer />
    </>
  )
}
