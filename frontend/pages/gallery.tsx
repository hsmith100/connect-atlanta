import { useState, useEffect } from 'react'
import SEO from '../components/shared/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import GalleryGrid from '../components/gallery/GalleryGrid'
import GalleryLightbox from '../components/gallery/GalleryLightbox'
import { getGallery } from '../lib/api'
import type { Photo } from '@shared/types/photos'

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    getGallery()
      .then(data => setPhotos(data.photos))
      .catch(() => setError('Could not load gallery. Please try again later.'))
      .finally(() => setLoading(false))
  }, [])

  const openImage = (index: number) => {
    setSelectedIndex(index)
    document.body.style.overflow = 'hidden'
  }

  const closeImage = () => {
    setSelectedIndex(null)
    document.body.style.overflow = 'unset'
  }

  const nextImage = () => {
    if (selectedIndex !== null) setSelectedIndex((selectedIndex + 1) % photos.length)
  }

  const prevImage = () => {
    if (selectedIndex !== null) setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length)
  }

  return (
    <>
      <SEO
        title="Event Gallery | Beats on the Beltline"
        description="Check out our vibe! Browse photos from Beats on the Beltline events."
        canonicalUrl="https://yourfestival.com/gallery"
      />

      <Header />

      <main className="pt-28 md:pt-[3.5rem]">
        <section className="py-8 md:py-12 relative overflow-hidden hero-gradient-gold">
          <div className="section-container relative z-10">
            <div className="text-center mb-12">
              <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black mb-8 uppercase bg-gradient-to-r from-brand-pink via-brand-peach to-brand-primary bg-clip-text text-transparent">
                Event Gallery
              </h1>
            </div>

            <GalleryGrid photos={photos} loading={loading} error={error} onImageClick={openImage} />
          </div>
        </section>
      </main>

      {selectedIndex !== null && (
        <GalleryLightbox
          photos={photos}
          selectedIndex={selectedIndex}
          onClose={closeImage}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}

      <Footer />
    </>
  )
}
