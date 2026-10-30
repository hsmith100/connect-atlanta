import { useEffect, useRef } from 'react'
import { Check, Loader2 } from 'lucide-react'
import type { PublicPhoto } from '@shared/types/store'
import { useStoreCart } from '../../lib/store/cartContext'

interface Props {
  photos: PublicPhoto[]
  onSelect: (index: number) => void
  hasMore: boolean
  loadMore: () => void
  loading: boolean
}

export default function PhotoGrid({ photos, onSelect, hasMore, loadMore, loading }: Props) {
  const cart = useStoreCart()
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Load the next page as the visitor nears the end of the grid.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !loading) loadMore()
    }, { rootMargin: '600px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  return (
    <div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`View photo ${i + 1}${cart.has(p.id) ? ' (in cart)' : ''}`}
              className="relative block w-full aspect-[3/2] overflow-hidden rounded-lg bg-brand-bg group"
            >
              <img src={p.thumbnailUrl} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              {cart.has(p.id) && (
                <span className="absolute top-2 right-2 bg-brand-pink text-white rounded-full p-1 shadow" aria-hidden="true">
                  <Check size={14} />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} className="flex justify-center py-8">
        {loading ? (
          <Loader2 className="animate-spin text-brand-pink" size={32} aria-label="Loading more photos" />
        ) : hasMore ? (
          <button type="button" onClick={loadMore} className="text-brand-pink font-semibold hover:underline">Load more photos</button>
        ) : null}
      </div>
    </div>
  )
}
