import { useEffect, useState } from 'react'
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import type { LibraryPhoto, PhotoCollection } from '@shared/types/store'
import { getGalleryPhotos, updateLibraryPhotos } from '../../../lib/api/adminLibrary'

interface Props {
  adminKey: string
  collections: PhotoCollection[]
}

const buttonClass = 'text-xs font-semibold rounded-lg px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 disabled:opacity-50'

// Order of the public Gallery across all events. Mirrors exactly what visitors see.
export function GalleryOrderSection({ adminKey, collections }: Props) {
  const [photos, setPhotos] = useState<LibraryPhoto[] | null>(null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const titles = new Map(collections.map((c) => [c.id, c.title]))

  useEffect(() => {
    getGalleryPhotos(adminKey)
      .then(setPhotos)
      .catch(() => setError('Could not load the gallery. Refresh to try again.'))
  }, [adminKey])

  function move(index: number, direction: -1 | 1) {
    setPhotos((prev) => {
      if (!prev) return prev
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setDirty(true)
    setStatusMsg('')
  }

  async function save() {
    if (!photos) return
    setBusy(true)
    setError('')
    try {
      await updateLibraryPhotos(adminKey, photos.map((p, i) => ({ id: p.id, gallerySortOrder: (i + 1) * 10 })))
      setDirty(false)
      setStatusMsg('Gallery order saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the order.')
    } finally {
      setBusy(false)
    }
  }

  async function removeFromGallery(id: string) {
    setBusy(true)
    setError('')
    try {
      await updateLibraryPhotos(adminKey, [{ id, inGallery: false }])
      setPhotos((prev) => prev?.filter((p) => p.id !== id) ?? prev)
      setStatusMsg('Removed from the gallery.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the photo.')
    } finally {
      setBusy(false)
    }
  }

  if (error && !photos) return <p role="alert" className="text-sm text-red-400">{error}</p>
  if (!photos) return <p className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading gallery…</p>
  if (photos.length === 0) {
    return <p className="text-sm text-gray-400">No photos are in the gallery. Open a collection, select photos and choose “Show in gallery”.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-gray-300 flex-1">{photos.length} photos in the gallery, in the order visitors see them.</p>
        <button type="button" onClick={() => void save()} disabled={busy || !dirty} className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg px-4 py-1.5 text-sm font-semibold disabled:opacity-50">
          Save order
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {statusMsg && <p className="text-sm text-green-400">{statusMsg}</p>}
      <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((p, i) => (
          <li key={p.id} className="rounded-lg overflow-hidden border border-gray-800 bg-gray-900">
            <img src={p.webThumbUrl} alt={p.originalFilename} loading="lazy" className="w-full aspect-[3/2] object-cover" />
            <div className="p-2 text-xs space-y-1">
              <p className="truncate text-gray-300">{i + 1}. {titles.get(p.collectionId) ?? 'Event'}</p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label={`Move ${p.originalFilename} earlier`} className="p-1 text-gray-400 hover:text-white disabled:opacity-30"><ArrowUp size={12} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={busy || i === photos.length - 1} aria-label={`Move ${p.originalFilename} later`} className="p-1 text-gray-400 hover:text-white disabled:opacity-30"><ArrowDown size={12} /></button>
                <button type="button" onClick={() => void removeFromGallery(p.id)} disabled={busy} className={`ml-auto ${buttonClass} px-2 py-1`}>Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
