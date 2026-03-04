import { useState, useRef, useCallback } from 'react'
import { Upload, Trash2, Save, Loader2, AlertCircle } from 'lucide-react'
import { getAdminPhotos, presignPhotos, createPhotos, updatePhotos, deletePhotos } from '../../lib/api'
import { generateThumbnail } from '../../lib/generateThumbnail'
import { PhotoCard } from './PhotoCard'
import type { Photo, PresignRequest, PresignResponse } from '@shared/types/photos'
import type { Event } from '@shared/types/events'

interface PhotosTabProps {
  adminKey: string
  photos: Photo[]
  events: Event[]
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>
}

export function PhotosTab({ adminKey, photos, events, setPhotos }: PhotosTabProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterEventId, setFilterEventId] = useState('')
  const [uploadEventId, setUploadEventId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragIndexRef = useRef<number | null>(null)

  const filteredPhotos = filterEventId
    ? photos.filter((p) => p.eventId === filterEventId)
    : photos

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleToggleVisible(id: string, visible: boolean) {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, visible } : p))
    try {
      await updatePhotos(adminKey, [{ id, visible }])
    } catch {
      setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, visible: !visible } : p))
      setError('Failed to update visibility.')
    }
  }

  const handleDragStart = useCallback((index: number) => { dragIndexRef.current = index }, [])
  const handleDragOver = useCallback((_e: React.DragEvent, _index: number) => {}, [])
  const handleDrop = useCallback((dropIndex: number) => {
    const dragIndex = dragIndexRef.current
    if (dragIndex === null || dragIndex === dropIndex) return
    setPhotos((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(dropIndex, 0, moved)
      return next
    })
    dragIndexRef.current = null
  }, [setPhotos])

  async function handleSaveOrder() {
    setSaving(true)
    setStatusMsg('')
    try {
      const updates = photos.map((p, i) => ({ id: p.id, sortOrder: i * 10 }))
      await updatePhotos(adminKey, updates)
      setPhotos((prev) => prev.map((p, i) => ({ ...p, sortOrder: i * 10 })))
      setStatusMsg('Order saved.')
    } catch {
      setError('Failed to save order.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} photo(s)?`)) return
    setDeleting(true)
    setStatusMsg('')
    try {
      const ids = [...selectedIds]
      await deletePhotos(adminKey, ids)
      setPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)))
      setSelectedIds(new Set())
      setStatusMsg(`Deleted ${ids.length} photo(s).`)
    } catch {
      setError('Failed to delete photos.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setStatusMsg('')
    setError('')
    try {
      const requests: PresignRequest[] = files.map((file) => ({
        id: crypto.randomUUID(),
        filename: file.name,
        contentType: file.type || 'image/jpeg',
      }))
      const presigned: PresignResponse[] = await presignPhotos(adminKey, requests)
      await Promise.all(presigned.map(async (p, i) => {
        const file = files[i]
        const thumbBlob = await generateThumbnail(file)
        await Promise.all([
          fetch(p.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'image/jpeg' } }),
          fetch(p.thumbUploadUrl, { method: 'PUT', body: thumbBlob, headers: { 'Content-Type': 'image/jpeg' } }),
        ])
      }))
      const startOrder = photos.length * 10
      const payloads = presigned.map((p, i) => ({
        id: p.id,
        url: p.url,
        thumbnailUrl: p.thumbnailUrl,
        eventId: uploadEventId || null,
        sortOrder: startOrder + i * 10,
      }))
      await createPhotos(adminKey, payloads)
      const refreshed = await getAdminPhotos(adminKey)
      setPhotos(refreshed.photos)
      setStatusMsg(`Uploaded ${files.length} photo(s).`)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Upload failed. Check console for details.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center gap-3 flex-wrap">
        <select
          value={filterEventId}
          onChange={(e) => setFilterEventId(e.target.value)}
          className="bg-gray-800 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-700"
        >
          <option value="">All events</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        <select
          value={uploadEventId}
          onChange={(e) => setUploadEventId(e.target.value)}
          className="bg-gray-800 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-700"
          title="Tag uploads to this event"
        >
          <option value="">No event tag</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        <label className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg px-4 py-1.5 text-sm font-semibold cursor-pointer transition-colors">
          <Upload size={16} />
          {uploading ? 'Uploading…' : 'Upload photos'}
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
        {selectedIds.size > 0 && (
          <button onClick={handleDeleteSelected} disabled={deleting} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50">
            <Trash2 size={16} />
            {deleting ? 'Deleting…' : `Delete (${selectedIds.size})`}
          </button>
        )}
        <button onClick={handleSaveOrder} disabled={saving} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50">
          <Save size={16} />
          {saving ? 'Saving…' : 'Save order'}
        </button>
      </div>

      {/* Status bar */}
      {(statusMsg || error || uploading) && (
        <div className={`px-6 py-2 text-sm flex items-center gap-2 ${error ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'}`}>
          {uploading && <Loader2 size={14} className="animate-spin" />}
          {error && <AlertCircle size={14} />}
          <span>{uploading ? 'Uploading photos…' : error || statusMsg}</span>
          {(error || statusMsg) && <button onClick={() => { setError(''); setStatusMsg('') }} className="ml-auto text-xs opacity-60 hover:opacity-100">×</button>}
        </div>
      )}

      {/* Grid */}
      <div className="p-6">
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No photos yet.</p>
            <p className="text-sm mt-1">Upload photos using the button above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {filteredPhotos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                selected={selectedIds.has(photo.id)}
                onSelect={toggleSelect}
                onToggleVisible={handleToggleVisible}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
