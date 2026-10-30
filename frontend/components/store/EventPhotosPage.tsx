import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { PublicCollectionPage, PublicPhoto } from '@shared/types/store'
import { getPublicCollectionPage } from '../../lib/api/store'
import { ApiError } from '../../lib/api/client'
import { formatEventDate } from '../../lib/formatters'
import PhotoGrid from './PhotoGrid'
import PhotoDetailModal from './PhotoDetailModal'

interface Props {
  collectionId: string | null
}

type LoadState = 'loading' | 'ready' | 'notFound' | 'error'

export default function EventPhotosPage({ collectionId }: Props) {
  const [state, setState] = useState<LoadState>(collectionId ? 'loading' : 'notFound')
  const [collection, setCollection] = useState<PublicCollectionPage['collection'] | null>(null)
  const [photos, setPhotos] = useState<PublicPhoto[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const loadingMoreRef = useRef(false)

  useEffect(() => {
    if (!collectionId) return
    let cancelled = false
    getPublicCollectionPage(collectionId)
      .then((page) => {
        if (cancelled) return
        setCollection(page.collection)
        setPhotos(page.photos)
        setCursor(page.nextCursor)
        setState('ready')
      })
      .catch((err: unknown) => {
        if (!cancelled) setState(err instanceof ApiError && err.status === 404 ? 'notFound' : 'error')
      })
    return () => { cancelled = true }
  }, [collectionId])

  // Returns how many photos were added, so the viewer can step onto the first new one.
  const loadMore = useCallback(async (): Promise<number> => {
    if (!collectionId || !cursor || loadingMoreRef.current) return 0
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const page = await getPublicCollectionPage(collectionId, cursor)
      setPhotos((prev) => [...prev, ...page.photos])
      setCursor(page.nextCursor)
      return page.photos.length
    } catch {
      return 0
    } finally {
      loadingMoreRef.current = false
      setLoadingMore(false)
    }
  }, [collectionId, cursor])

  const handleNext = useCallback(() => {
    if (selected === null) return
    if (selected < photos.length - 1) setSelected(selected + 1)
    else if (cursor) void loadMore().then((added) => { if (added > 0) setSelected(selected + 1) })
  }, [selected, photos.length, cursor, loadMore])

  if (state === 'loading') {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-brand-pink" size={40} aria-label="Loading photos" /></div>
  }
  if (state === 'notFound' || state === 'error') {
    return (
      <div className="section-container py-24 text-center">
        <p role="alert" className="text-xl text-brand-header mb-6">
          {state === 'notFound' ? "This photo collection isn't available." : "We couldn't load these photos. Please try again later."}
        </p>
        <Link href="/shop#photos" className="text-brand-pink font-semibold hover:underline">Back to event photos</Link>
      </div>
    )
  }

  return (
    <section className="section-container py-8 md:py-12">
      <Link href="/shop#photos" className="inline-flex items-center gap-1 text-sm text-brand-pink hover:underline mb-4">
        <ArrowLeft size={14} /> All event photos
      </Link>
      <h1 className="font-title text-4xl md:text-6xl font-black text-brand-header uppercase">{collection?.title}</h1>
      <p className="text-brand-text/80 mb-8">
        {formatEventDate(collection?.eventDate)} · {collection?.photoCount} photos for sale. Tap a photo to see it larger and add it to your cart.
      </p>

      {photos.length === 0 ? (
        <p className="text-center text-brand-text py-12">No photos are on sale in this collection right now.</p>
      ) : (
        <PhotoGrid photos={photos} onSelect={setSelected} hasMore={!!cursor} loadMore={() => void loadMore()} loading={loadingMore} />
      )}

      {selected !== null && photos[selected] && collectionId && (
        <PhotoDetailModal
          photos={photos}
          index={selected}
          collectionId={collectionId}
          hasMore={!!cursor}
          onClose={() => setSelected(null)}
          onNext={handleNext}
          onPrev={() => setSelected((i) => (i !== null && i > 0 ? i - 1 : i))}
        />
      )}
    </section>
  )
}
