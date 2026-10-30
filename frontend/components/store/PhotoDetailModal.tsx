import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, Loader2, ShoppingCart, Check } from 'lucide-react'
import type { PublicPhoto } from '@shared/types/store'
import { useStoreCart } from '../../lib/store/cartContext'
import { formatMoney } from '../../lib/store/formatMoney'

interface Props {
  photos: PublicPhoto[]
  index: number
  collectionId: string
  hasMore: boolean
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export default function PhotoDetailModal({ photos, index, collectionId, hasMore, onClose, onNext, onPrev }: Props) {
  const cart = useStoreCart()
  const photo = photos[index]
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const inCart = cart.has(photo.id)
  const canNext = index < photos.length - 1 || hasMore

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && canNext) onNext()
      if (e.key === 'ArrowLeft' && index > 0) onPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNext, onPrev, canNext, index])

  // Lock background scroll and move focus into the dialog while it's open.
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.body.style.overflow = '' }
  }, [])

  function toggleCart() {
    if (inCart) cart.remove(photo.id)
    else cart.add({ photoId: photo.id, collectionId, thumbnailUrl: photo.thumbnailUrl })
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`Photo ${index + 1}`} className="fixed inset-0 z-[100] bg-black/95 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between p-3 md:p-4 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm">{index + 1} / {photos.length}{hasMore ? '+' : ''}</span>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 bg-black/50 hover:text-brand-pink">
          <X size={28} />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-12 md:px-20" onClick={(e) => e.stopPropagation()}>
        {index > 0 && (
          <button type="button" onClick={onPrev} aria-label="Previous photo" className="absolute left-2 md:left-4 text-white rounded-full p-2 bg-black/50 hover:text-brand-pink">
            <ChevronLeft size={32} />
          </button>
        )}
        {loadedSrc !== photo.previewUrl && <Loader2 className="absolute animate-spin text-white" size={40} aria-label="Loading photo" />}
        <img
          key={photo.previewUrl}
          src={photo.previewUrl}
          alt={`Event photo ${index + 1}, watermarked preview`}
          onLoad={() => setLoadedSrc(photo.previewUrl)}
          className="max-w-full max-h-full object-contain"
        />
        {canNext && (
          <button type="button" onClick={onNext} aria-label="Next photo" className="absolute right-2 md:right-4 text-white rounded-full p-2 bg-black/50 hover:text-brand-pink">
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-wrap items-center justify-center gap-3 md:gap-6 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="text-xl font-bold">{formatMoney(photo.priceCents)}</span>
        {photo.photographerName && <span className="text-sm text-white/70">Photo by {photo.photographerName}</span>}
        <button
          type="button"
          onClick={toggleCart}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 font-bold transition-colors ${
            inCart ? 'bg-white text-brand-header hover:bg-white/90' : 'bg-brand-pink text-white hover:bg-brand-pink/90'
          }`}
        >
          {inCart ? <Check size={18} /> : <ShoppingCart size={18} />}
          {inCart ? 'In cart — remove' : 'Add to cart'}
        </button>
        {cart.count > 0 && (
          <Link href="/shop/cart" className="text-sm underline hover:text-brand-pink">
            View cart ({cart.count})
          </Link>
        )}
      </div>
    </div>
  )
}
