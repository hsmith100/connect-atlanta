import { Camera, Loader2, AlertCircle } from 'lucide-react'
import type { Photo } from '@shared/types/photos'

interface GalleryGridProps {
  photos: Photo[]
  loading: boolean
  error: string | null
  onImageClick: (index: number) => void
}

export default function GalleryGrid({ photos, loading, error, onImageClick }: GalleryGridProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-brand-primary" size={48} />
        <span className="ml-4 text-xl text-brand-header">Loading gallery...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <div className="bg-red-100 border-2 border-red-400 rounded-lg p-6">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <p className="text-red-800 mb-4">{error}</p>
        </div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="mx-auto mb-4 text-brand-primary/40" size={64} />
        <p className="text-xl text-brand-header/60">No photos available yet.</p>
        <p className="text-brand-header/40 mt-2">Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, index) => (
        <div
          key={photo.id || index}
          className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer"
          onClick={() => onImageClick(index)}
        >
          <img
            src={photo.thumbnailUrl || photo.url}
            alt={`Gallery photo ${index + 1}`}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-header/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  )
}
