import { useEffect, useRef, useState } from 'react'
import { GripVertical, Loader2 } from 'lucide-react'
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragIndexRef = useRef<number | null>(null)
  // Order when the drag started — used to detect a real move and to revert if saving fails.
  const orderBeforeDragRef = useRef<LibraryPhoto[] | null>(null)
  const titles = new Map(collections.map((c) => [c.id, c.title]))

  useEffect(() => {
    getGalleryPhotos(adminKey)
      .then(setPhotos)
      .catch(() => setError('Could not load the gallery. Refresh to try again.'))
  }, [adminKey])

  // Drag and drop: the grid reorders live as the dragged photo passes over others,
  // and the new order is saved automatically when the photo is dropped.
  function handleDragStart(e: React.DragEvent, index: number, id: string) {
    dragIndexRef.current = index
    orderBeforeDragRef.current = photos
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id) // Firefox won't start a drag without data
  }

  function handleDragOver(e: React.DragEvent, overIndex: number) {
    e.preventDefault()
    const from = dragIndexRef.current
    if (from === null || from === overIndex) return
    setPhotos((prev) => {
      if (!prev) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(overIndex, 0, moved)
      return next
    })
    dragIndexRef.current = overIndex
    setStatusMsg('')
  }

  function handleDragEnd() {
    const before = orderBeforeDragRef.current
    dragIndexRef.current = null
    orderBeforeDragRef.current = null
    setDraggingId(null)
    if (!photos || !before) return
    const moved = photos.some((p, i) => p.id !== before[i]?.id)
    if (moved) void saveOrder(photos, before)
  }

  async function saveOrder(ordered: LibraryPhoto[], before: LibraryPhoto[]) {
    setBusy(true)
    setError('')
    setStatusMsg('Saving…')
    try {
      await updateLibraryPhotos(adminKey, ordered.map((p, i) => ({ id: p.id, gallerySortOrder: (i + 1) * 10 })))
      setStatusMsg('Gallery order saved.')
    } catch (err) {
      setPhotos(before)
      setStatusMsg('')
      setError(`${err instanceof Error ? err.message : 'Could not save the order.'} The previous order was restored.`)
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
      <p className="text-sm text-gray-300">
        {photos.length} photos in the gallery, in the order visitors see them. Drag a photo to reorder; changes save automatically.
      </p>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {statusMsg && (
        <p role="status" className="flex items-center gap-2 text-sm text-green-400">
          {busy && <Loader2 size={14} className="animate-spin" />}
          {statusMsg}
        </p>
      )}
      <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((p, i) => (
          <li
            key={p.id}
            draggable={!busy}
            onDragStart={(e) => handleDragStart(e, i, p.id)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={handleDragEnd}
            data-testid={`gallery-item-${p.id}`}
            className={`rounded-lg overflow-hidden border bg-gray-900 cursor-grab active:cursor-grabbing transition-opacity ${
              draggingId === p.id ? 'opacity-40 border-brand-pink' : 'border-gray-800'
            }`}
          >
            <img src={p.webThumbUrl} alt={p.originalFilename} loading="lazy" draggable={false} className="w-full aspect-[3/2] object-cover pointer-events-none" />
            <div className="p-2 text-xs flex items-center gap-1">
              <GripVertical size={14} className="text-gray-500 shrink-0" aria-hidden="true" />
              <p className="truncate text-gray-300 flex-1">{i + 1}. {titles.get(p.collectionId) ?? 'Event'}</p>
              <button type="button" onClick={() => void removeFromGallery(p.id)} disabled={busy} className={`${buttonClass} px-2 py-1`}>Remove</button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
