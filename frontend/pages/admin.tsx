import { useState, useEffect, useRef, useCallback } from 'react'
import { Eye, EyeOff, Trash2, Upload, Save, GripVertical, Loader2, AlertCircle, ImageIcon, Plus } from 'lucide-react'
import {
  getAdminPhotos,
  getAdminEvents,
  getEvents,
  presignPhotos,
  createPhotos,
  updatePhotos,
  deletePhotos,
  presignFlyer,
  updateEventFlyer,
  updateEventGoLive,
  createEvent,
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
      <div className="aspect-square">
        <img
          src={photo.thumbnailUrl}
          alt=""
          className={`w-full h-full object-cover transition-opacity ${photo.visible ? 'opacity-100' : 'opacity-40'}`}
          loading="lazy"
        />
      </div>
      <div className="absolute top-1 left-1 cursor-grab text-white/60 bg-black/40 rounded p-0.5">
        <GripVertical size={16} />
      </div>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(photo.id)}
        className="absolute top-1 right-1 w-5 h-5 cursor-pointer accent-brand-primary"
        onClick={(e) => e.stopPropagation()}
      />
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

// ── Photos tab ────────────────────────────────────────────────────────────────

interface PhotosTabProps {
  adminKey: string
  photos: Photo[]
  events: Event[]
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>
}

function PhotosTab({ adminKey, photos, events, setPhotos }: PhotosTabProps) {
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

// ── Events tab ────────────────────────────────────────────────────────────────

interface EventsTabProps {
  adminKey: string
  events: Event[]
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>
}

// Convert ISO datetime string to datetime-local input value (local time)
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function GoLiveBadge({ goLiveAt }: { goLiveAt?: string | null }) {
  if (!goLiveAt) {
    return <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">Always live</span>
  }
  const isLive = goLiveAt <= new Date().toISOString()
  return isLive
    ? <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-800 text-green-200">Live now</span>
    : <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-yellow-800 text-yellow-200">Scheduled: {new Date(goLiveAt).toLocaleString()}</span>
}

function EventsTab({ adminKey, events, setEvents }: EventsTabProps) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [savingGoLive, setSavingGoLive] = useState<Record<string, boolean>>({})
  const [goLiveDates, setGoLiveDates] = useState<Record<string, string>>({})
  const [goLiveTimes, setGoLiveTimes] = useState<Record<string, string>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const emptyForm = { title: '', date: '', startTime: '', endTime: '', location: '', ticketingUrl: '', goLiveDate: '', goLiveTime: '' }
  const [newEvent, setNewEvent] = useState(emptyForm)
  const [newEventFile, setNewEventFile] = useState<File | null>(null)
  const [newEventPreview, setNewEventPreview] = useState<string | null>(null)
  const [savingNew, setSavingNew] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')

  const inputCls = 'w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-brand-primary'

  async function handleSetGoLive(ev: Event) {
    const existingLocal = ev.goLiveAt ? toDatetimeLocal(ev.goLiveAt) : ''
    const date = ev.id in goLiveDates ? goLiveDates[ev.id] : existingLocal.slice(0, 10)
    const time = ev.id in goLiveTimes ? goLiveTimes[ev.id] : existingLocal.slice(11, 16)
    const goLiveAt = date ? new Date(`${date}T${time || '00:00'}`).toISOString() : null
    setSavingGoLive((prev) => ({ ...prev, [ev.id]: true }))
    setStatusMsg('')
    setError('')
    try {
      await updateEventGoLive(adminKey, ev.id, goLiveAt)
      setEvents((prev) => prev.map((e) => e.id === ev.id ? { ...e, goLiveAt } : e))
      setStatusMsg(goLiveAt ? `Go-live set for "${ev.title}".` : `Schedule cleared for "${ev.title}".`)
    } catch (err) {
      console.error('Go-live update error:', err)
      setError(`Failed to update go-live for "${ev.title}".`)
    } finally {
      setSavingGoLive((prev) => ({ ...prev, [ev.id]: false }))
    }
  }

  async function handleCreateEvent() {
    if (!newEvent.title || !newEvent.date) { setError('Title and date are required.'); return }
    setSavingNew(true)
    setError('')
    setStatusMsg('')
    try {
      const goLiveAt = newEvent.goLiveDate
        ? new Date(`${newEvent.goLiveDate}T${newEvent.goLiveTime || '00:00'}`).toISOString()
        : undefined
      const id = crypto.randomUUID()

      // Upload flyer first if one was selected
      let flyerUrl: string | undefined
      if (newEventFile) {
        const { uploadUrl, flyerUrl: url } = await presignFlyer(adminKey, id, newEventFile.name, newEventFile.type || 'image/jpeg')
        const res = await fetch(uploadUrl, { method: 'PUT', body: newEventFile, headers: { 'Content-Type': newEventFile.type || 'image/jpeg' } })
        if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`)
        flyerUrl = url
      }

      await createEvent(adminKey, {
        id,
        title: newEvent.title,
        date: newEvent.date,
        ...(newEvent.startTime ? { startTime: newEvent.startTime } : {}),
        ...(newEvent.endTime ? { endTime: newEvent.endTime } : {}),
        ...(newEvent.location ? { location: newEvent.location } : {}),
        ...(flyerUrl ? { flyerUrl } : {}),
        ...(newEvent.ticketingUrl ? { ticketingUrl: newEvent.ticketingUrl } : {}),
        ...(goLiveAt ? { goLiveAt } : {}),
      })
      setEvents((prev) => [...prev, {
        id, entity: 'EVENT', title: newEvent.title, date: newEvent.date,
        startTime: newEvent.startTime || null, endTime: newEvent.endTime || null,
        location: newEvent.location || null, flyerUrl: flyerUrl ?? null,
        ticketingUrl: newEvent.ticketingUrl || null, goLiveAt: goLiveAt ?? null,
      }])
      setNewEvent(emptyForm)
      setNewEventFile(null)
      if (newEventPreview) { URL.revokeObjectURL(newEventPreview); setNewEventPreview(null) }
      setShowAddForm(false)
      setStatusMsg(`Event "${newEvent.title}" created.`)
    } catch (err) {
      console.error('Create event error:', err)
      setError('Failed to create event.')
    } finally {
      setSavingNew(false)
    }
  }

  async function handleFlyerUpload(event: Event, file: File) {
    setUploading((prev) => ({ ...prev, [event.id]: true }))
    setStatusMsg('')
    setError('')
    try {
      const { uploadUrl, flyerUrl } = await presignFlyer(adminKey, event.id, file.name, file.type || 'image/jpeg')
      const res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'image/jpeg' } })
      if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`)
      await updateEventFlyer(adminKey, event.id, flyerUrl)
      setEvents((prev) => prev.map((ev) => ev.id === event.id ? { ...ev, flyerUrl } : ev))
      setStatusMsg(`Flyer updated for "${event.title}".`)
    } catch (err) {
      console.error('Flyer upload error:', err)
      setError(`Failed to upload flyer for "${event.title}".`)
    } finally {
      setUploading((prev) => ({ ...prev, [event.id]: false }))
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-sm text-gray-400">{events.length} event{events.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Event
        </button>
      </div>

      {/* Status bar */}
      {(statusMsg || error) && (
        <div className={`px-6 py-2 text-sm flex items-center gap-2 ${error ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'}`}>
          {error && <AlertCircle size={14} />}
          <span>{error || statusMsg}</span>
          <button onClick={() => { setError(''); setStatusMsg('') }} className="ml-auto text-xs opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* Add Event form */}
      {showAddForm && (
        <div className="p-6 border-b border-gray-800">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-5 space-y-4 max-w-lg">
            <h3 className="text-white font-semibold">New Event</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title *</label>
              <input type="text" value={newEvent.title} onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))} placeholder="Beats on the Beltline" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Event Date *</label>
              <input type="date" value={newEvent.date} onChange={(e) => setNewEvent((p) => ({ ...p, date: e.target.value }))} className={inputCls} />
            </div>
            {/* Flyer upload */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Flyer (optional — can upload later)</label>
              <div className="flex gap-3 items-start">
                {newEventPreview ? (
                  <img src={newEventPreview} alt="Flyer preview" className="w-20 h-24 object-contain rounded-lg bg-gray-800 border border-gray-700 shrink-0" />
                ) : (
                  <div className="w-20 h-24 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                    <ImageIcon size={24} className="text-gray-600" />
                  </div>
                )}
                <label className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer transition-colors self-center">
                  <Upload size={14} />
                  {newEventFile ? 'Replace flyer' : 'Choose flyer'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (newEventPreview) URL.revokeObjectURL(newEventPreview)
                        setNewEventFile(file)
                        setNewEventPreview(URL.createObjectURL(file))
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                <input type="time" value={newEvent.startTime} onChange={(e) => setNewEvent((p) => ({ ...p, startTime: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">End Time</label>
                <input type="time" value={newEvent.endTime} onChange={(e) => setNewEvent((p) => ({ ...p, endTime: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Location</label>
              <input type="text" value={newEvent.location} onChange={(e) => setNewEvent((p) => ({ ...p, location: e.target.value }))} placeholder="Atlanta Beltline" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ticketing / Info URL</label>
              <input type="url" value={newEvent.ticketingUrl} onChange={(e) => setNewEvent((p) => ({ ...p, ticketingUrl: e.target.value }))} placeholder="https://..." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Go-live — leave blank for always live</label>
              <div className="flex gap-2">
                <input type="date" value={newEvent.goLiveDate} onChange={(e) => setNewEvent((p) => ({ ...p, goLiveDate: e.target.value }))} className={inputCls} />
                <input type="time" value={newEvent.goLiveTime} onChange={(e) => setNewEvent((p) => ({ ...p, goLiveTime: e.target.value }))} className="w-32 shrink-0 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-brand-primary" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreateEvent}
                disabled={savingNew || !newEvent.title || !newEvent.date}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {savingNew ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Event'}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewEvent(emptyForm); setNewEventFile(null); if (newEventPreview) { URL.revokeObjectURL(newEventPreview); setNewEventPreview(null) } }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events grid */}
      {events.length === 0 ? (
        <div className="p-6 text-center py-20 text-gray-500">
          <p className="text-lg">No events yet.</p>
          <p className="text-sm mt-1">Click "Add Event" to create one.</p>
        </div>
      ) : (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => {
            const existingLocal = ev.goLiveAt ? toDatetimeLocal(ev.goLiveAt) : ''
            const glDate = ev.id in goLiveDates ? goLiveDates[ev.id] : existingLocal.slice(0, 10)
            const glTime = ev.id in goLiveTimes ? goLiveTimes[ev.id] : existingLocal.slice(11, 16)
            return (
              <div key={ev.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
                {/* Flyer preview */}
                <div className="aspect-[4/5] bg-gray-800 flex items-center justify-center">
                  {ev.flyerUrl ? (
                    <img src={ev.flyerUrl} alt={ev.title} className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-600">
                      <ImageIcon size={40} />
                      <span className="text-xs">No flyer</span>
                    </div>
                  )}
                </div>
                {/* Event info + controls */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-white text-sm">{ev.title}</p>
                    <p className="text-gray-400 text-xs">{ev.date}</p>
                    <div className="mt-1"><GoLiveBadge goLiveAt={ev.goLiveAt} /></div>
                  </div>
                  {/* Flyer upload */}
                  <label className={`flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer transition-colors ${uploading[ev.id] ? 'bg-gray-700 opacity-50 cursor-wait' : 'bg-brand-primary hover:bg-brand-primary/90'} text-white`}>
                    {uploading[ev.id] ? (
                      <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                    ) : (
                      <><Upload size={14} /> {ev.flyerUrl ? 'Replace flyer' : 'Upload flyer'}</>
                    )}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading[ev.id]} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFlyerUpload(ev, file); e.target.value = '' }} />
                  </label>
                  {/* Go-live scheduler */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400">Go-live — leave blank to clear schedule</p>
                    <div className="flex gap-1.5">
                      <input
                        type="date"
                        value={glDate}
                        onChange={(e) => setGoLiveDates((prev) => ({ ...prev, [ev.id]: e.target.value }))}
                        className="flex-1 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700 focus:outline-none focus:border-brand-primary"
                      />
                      <input
                        type="time"
                        value={glTime}
                        onChange={(e) => setGoLiveTimes((prev) => ({ ...prev, [ev.id]: e.target.value }))}
                        className="w-24 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700 focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                    <button
                      onClick={() => handleSetGoLive(ev)}
                      disabled={savingGoLive[ev.id]}
                      className="flex items-center justify-center gap-1.5 w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {savingGoLive[ev.id] ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : <><Save size={12} /> Set Go-Live</>}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// ── Main admin page ───────────────────────────────────────────────────────────

type Tab = 'photos' | 'events'

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('photos')

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
      getAdminEvents(adminKey).catch(() => getEvents()).then(setEvents),
    ]).catch(console.error)
  }, [adminKey])

  if (!adminKey) {
    return <AuthGate onAuth={setAdminKey} />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin</h1>
        <button
          onClick={() => { localStorage.removeItem(STORAGE_KEY); setAdminKey(null) }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 flex gap-1">
        {(['photos', 'events'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'photos' && (
        <PhotosTab adminKey={adminKey} photos={photos} events={events} setPhotos={setPhotos} />
      )}
      {activeTab === 'events' && (
        <EventsTab adminKey={adminKey} events={events} setEvents={setEvents} />
      )}
    </div>
  )
}
