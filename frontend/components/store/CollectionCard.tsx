import Link from 'next/link'
import type { PublicCollection } from '@shared/types/store'
import { formatEventDate } from '../../lib/formatters'

interface Props {
  collection: PublicCollection
}

export default function CollectionCard({ collection }: Props) {
  return (
    <Link
      href={`/shop/photos?event=${encodeURIComponent(collection.id)}`}
      className="group block rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-shadow"
    >
      <div className="aspect-[3/2] bg-brand-bg overflow-hidden">
        {collection.coverThumbnailUrl && (
          <img
            src={collection.coverThumbnailUrl}
            alt={`Photos from ${collection.title}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-title text-xl font-bold text-brand-header">{collection.title}</h3>
        <p className="text-sm text-brand-text/80">
          {formatEventDate(collection.eventDate)} · {collection.photoCount} {collection.photoCount === 1 ? 'photo' : 'photos'}
        </p>
        {collection.photographerNames.length > 0 && (
          <p className="text-xs text-brand-text/60 mt-1">Photos by {collection.photographerNames.join(', ')}</p>
        )}
      </div>
    </Link>
  )
}
