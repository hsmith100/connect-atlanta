import { useState, useEffect, useRef, useCallback } from 'react'
import { Eye, EyeOff, Trash2, Upload, Save, GripVertical, Loader2, AlertCircle } from 'lucide-react'
import {
  getAdminPhotos,
  getEvents,
  presignPhotos,
  createPhotos,
  updatePhotos,
  deletePhotos,
} from '../lib/api'
import type { Photo, PresignRequest, PresignResponse } from '@shared/types/photos'
import type { Event } from '@shared/types/events'

const STORAGE_KEY = 'connect_admin_key'

// Generate a thumbnail blob via Canvas API (600px wide, JPEG 0.8)
function generateThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const maxWidth = 600
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        0.8,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

// ── Auth gate ─────────────────────────────────────────────────────────────────

function AuthGate({ onAuth }: { onAuth: (key: string) => void }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await getAdminPhotos(input)
      localStorage.setItem(STORAGE_KEY, input)
      onAuth(input)
    } catch {
      setError('Invalid admin key.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-white text-2xl font-bold text-center">Admin Login</h1>
        <input
          type="password"
          placeholder="Admin key"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:border-brand-primary"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !input}
          className="w-full bg-brand-primary text-white rounded-lg py-2 font-semibold disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

// ── Photo card ────────────────────────────────────────────────────────────────

interface PhotoCardProps {
  photo: Photo
  selected: boolean
  onSelect: (id: string) => void
  onToggleVisible: (id: string, visible: boolean) => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (index: number) => void
  index: number
}

function PhotoCard({ photo, selected, onSelect, onToggleVisible, onDragStart, onDragOver, onDrop, index }: PhotoCardProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e, index) }}
      onDrop={() => onDrop(index)}
      className={`relative rounded-xl overflow-hidden bg-gray-800 border-2 transition-colors ${selected ? 'border-brand-primary' : 'border-transparent'}`}
    >
      {/* Thumbnail */}
      <div className="aspect-square">
        <img
          src={photo.thumbnailUrl}
          alt=""
          className={`w-full h-full object-cover transition-opacity ${photo.visible ? 'opacity-100' : 'opacity-40'}`}
          loading="lazy"
        />
      </div>

      {/* Drag handle */}
      <div className="absolute top-1 left-1 cursor-grab text-white/60 bg-black/40 rounded p-0.5">
        <GripVertical size={16} />
      </div>

      {/* Select checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(photo.id)}
        className="absolute top-1 right-1 w-5 h-5 cursor-pointer accent-brand-primary"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Visibility toggle */}
      <button
        onClick={() => onToggleVisible(photo.id, !photo.visible)}
        className="absolute bottom-1 right-1 bg-black/60 rounded-full p-1 text-white hover:text-brand-primary transition-colors"
        title={photo.visible ? 'Hide photo' : 'Show photo'}
      >
        {photo.visible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  )
}

// ── Main admin page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [events, setEvents] = useState<Event[]>([])
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

  // Check for stored key on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      getAdminPhotos(stored)
        .then(() => setAdminKey(stored))
        .catch(() => localStorage.removeItem(STORAGE_KEY))
    }
  }, [])

  // Load photos + events when authenticated
  useEffect(() => {
    if (!adminKey) return
    Promise.all([
      getAdminPhotos(adminKey).then((r) => setPhotos(r.photos)),
      getEvents().then(setEvents),
    ]).catch(() => setError('Failed to load data.'))
  }, [adminKey])

  const filteredPhotos = filterEventId
    ? photos.filter((p) => p.eventId === filterEventId)
    : photos

  // ── Selection ───────────────────────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Visibility toggle ───────────────────────────────────────────────────────

  async function handleToggleVisible(id: string, visible: boolean) {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, visible } : p))
    try {
      await updatePhotos(adminKey!, [{ id, visible }])
    } catch {
      // Revert on failure
      setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, visible: !visible } : p))
      setError('Failed to update visibility.')
    }
  }

  // ── Drag-and-drop reorder ───────────────────────────────────────────────────

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index
  }, [])

  const handleDragOver = useCallback((_e: React.DragEvent, _index: number) => {
    // Allow drop — browser default preventDefault handled in card
  }, [])

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
  }, [])

  // ── Save order ──────────────────────────────────────────────────────────────

  async function handleSaveOrder() {
    setSaving(true)
    setStatusMsg('')
    try {
      const updates = photos.map((p, i) => ({ id: p.id, sortOrder: i * 10 }))
      await updatePhotos(adminKey!, updates)
      setPhotos((prev) => prev.map((p, i) => ({ ...p, sortOrder: i * 10 })))
      setStatusMsg('Order saved.')
    } catch {
      setError('Failed to save order.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete selected ─────────────────────────────────────────────────────────

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} photo(s)?`)) return
    setDeleting(true)
    setStatusMsg('')
    try {
      const ids = [...selectedIds]
      await deletePhotos(adminKey!, ids)
      setPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)))
      setSelectedIds(new Set())
      setStatusMsg(`Deleted ${ids.length} photo(s).`)
    } catch {
      setError('Failed to delete photos.')
    } finally {
      setDeleting(false)
    }
  }

  // ── Upload ──────────────────────────────────────────────────────────────────

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    setStatusMsg('')
    setError('')

    try {
      // 1. Get presigned URLs for each file
      const requests: PresignRequest[] = files.map((file) => ({
        id: crypto.randomUUID(),
        filename: file.name,
        contentType: file.type || 'image/jpeg',
      }))
      const presigned: PresignResponse[] = await presignPhotos(adminKey!, requests)

      // 2. For each file: generate thumbnail, PUT full + thumb to S3
      await Promise.all(presigned.map(async (p, i) => {
        const file = files[i]
        const thumbBlob = await generateThumbnail(file)

        await Promise.all([
          fetch(p.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'image/jpeg' } }),
          fetch(p.thumbUploadUrl, { method: 'PUT', body: thumbBlob, headers: { 'Content-Type': 'image/jpeg' } }),
        ])
      }))

      // 3. Create DynamoDB records
      const startOrder = photos.length * 10
      const payloads = presigned.map((p, i) => ({
        id: p.id,
        url: p.url,
        thumbnailUrl: p.thumbnailUrl,
        eventId: uploadEventId || null,
        sortOrder: startOrder + i * 10,
      }))
      await createPhotos(adminKey!, payloads)

      // 4. Refresh list
      const refreshed = await getAdminPhotos(adminKey!)
      setPhotos(refreshed.photos)
      setStatusMsg(`Uploaded ${files.length} photo(s).`)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Upload failed. Check console for details.')
    } finally {
      setUploading(false)
      // Reset file input so the same files can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!adminKey) {
    return <AuthGate onAuth={setAdminKey} />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold">Photo Admin</h1>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Event filter */}
          <select
            value={filterEventId}
            onChange={(e) => setFilterEventId(e.target.value)}
            className="bg-gray-800 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-700"
          >
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>

          {/* Upload event tag */}
          <select
            value={uploadEventId}
            onChange={(e) => setUploadEventId(e.target.value)}
            className="bg-gray-800 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-700"
            title="Tag uploads to this event"
          >
            <option value="">No event tag</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>

          {/* Upload button */}
          <label className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg px-4 py-1.5 text-sm font-semibold cursor-pointer transition-colors">
            <Upload size={16} />
            {uploading ? 'Uploading…' : 'Upload photos'}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>

          {/* Delete selected */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting…' : `Delete (${selectedIds.size})`}
            </button>
          )}

          {/* Save order */}
          <button
            onClick={handleSaveOrder}
            disabled={saving}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save order'}
          </button>
        </div>
      </div>

      {/* Status / error bar */}
      {(statusMsg || error || uploading) && (
        <div className={`px-6 py-2 text-sm flex items-center gap-2 ${error ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'}`}>
          {uploading && <Loader2 size={14} className="animate-spin" />}
          {error && <AlertCircle size={14} />}
          <span>{uploading ? 'Uploading photos…' : error || statusMsg}</span>
          {(error || statusMsg) && (
            <button onClick={() => { setError(''); setStatusMsg('') }} className="ml-auto text-xs opacity-60 hover:opacity-100">×</button>
          )}
        </div>
      )}

      {/* Photo grid */}
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

      {/* Sign out */}
      <div className="px-6 pb-6">
        <button
          onClick={() => { localStorage.removeItem(STORAGE_KEY); setAdminKey(null) }}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
