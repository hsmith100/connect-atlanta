import { useState } from 'react'
import { Trash2, Upload, Loader2, AlertCircle, ImageIcon, Plus, Pencil } from 'lucide-react'
import { presignFlyer, updateEvent, createEvent, deleteEvent } from '../../lib/api'
import type { Event } from '@shared/types/events'

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

interface EventsTabProps {
  adminKey: string
  events: Event[]
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>
}

export function EventsTab({ adminKey, events, setEvents }: EventsTabProps) {
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const emptyForm = { title: '', date: '', startTime: '', endTime: '', location: '', ticketingUrl: '', goLiveDate: '', goLiveTime: '', description: '', buttonText: '' }
  const [newEvent, setNewEvent] = useState(emptyForm)
  const [newEventFile, setNewEventFile] = useState<File | null>(null)
  const [newEventPreview, setNewEventPreview] = useState<string | null>(null)
  const [savingNew, setSavingNew] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')

  function resetForm() {
    setEditingEventId(null)
    setNewEvent(emptyForm)
    setNewEventFile(null)
    if (newEventPreview?.startsWith('blob:')) URL.revokeObjectURL(newEventPreview)
    setNewEventPreview(null)
    setShowAddForm(false)
  }

  function handleStartEdit(ev: Event) {
    const existingLocal = ev.goLiveAt ? toDatetimeLocal(ev.goLiveAt) : ''
    setEditingEventId(ev.id)
    setNewEvent({
      title: ev.title,
      date: ev.date,
      startTime: ev.startTime ?? '',
      endTime: ev.endTime ?? '',
      location: ev.location ?? '',
      ticketingUrl: ev.ticketingUrl ?? '',
      goLiveDate: existingLocal.slice(0, 10),
      goLiveTime: existingLocal.slice(11, 16),
      description: ev.description ?? '',
      buttonText: ev.buttonText ?? '',
    })
    setNewEventFile(null)
    setNewEventPreview(ev.flyerUrl ?? null)
    setShowAddForm(true)
    setError('')
    setStatusMsg('')
  }

  const inputCls = 'w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-brand-primary'

  async function handleSaveEvent() {
    if (!newEvent.title || !newEvent.date) { setError('Title and date are required.'); return }
    setSavingNew(true)
    setError('')
    setStatusMsg('')
    try {
      // Generate the ID upfront so the flyer presign key matches the event ID
      const eventId = editingEventId ?? crypto.randomUUID()

      let flyerUrl: string | undefined
      if (newEventFile) {
        const { uploadUrl, flyerUrl: url } = await presignFlyer(adminKey, eventId, newEventFile.name, newEventFile.type || 'image/jpeg')
        const res = await fetch(uploadUrl, { method: 'PUT', body: newEventFile, headers: { 'Content-Type': newEventFile.type || 'image/jpeg' } })
        if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`)
        flyerUrl = url
      }

      if (editingEventId) {
        // Edit mode — send all editable fields; null clears optional fields
        const goLiveAt = newEvent.goLiveDate
          ? new Date(`${newEvent.goLiveDate}T${newEvent.goLiveTime || '00:00'}`).toISOString()
          : null
        await updateEvent(adminKey, editingEventId, {
          title: newEvent.title,
          date: newEvent.date,
          startTime: newEvent.startTime || null,
          endTime: newEvent.endTime || null,
          location: newEvent.location || null,
          ticketingUrl: newEvent.ticketingUrl || null,
          description: newEvent.description || null,
          buttonText: newEvent.buttonText || null,
          goLiveAt,
          ...(flyerUrl ? { flyerUrl } : {}),
        })
        setEvents((prev) => prev.map((e) => e.id === editingEventId ? {
          ...e,
          title: newEvent.title,
          date: newEvent.date,
          startTime: newEvent.startTime || null,
          endTime: newEvent.endTime || null,
          location: newEvent.location || null,
          ticketingUrl: newEvent.ticketingUrl || null,
          description: newEvent.description || null,
          buttonText: newEvent.buttonText || null,
          goLiveAt,
          ...(flyerUrl ? { flyerUrl } : {}),
        } : e))
        setStatusMsg(`Event "${newEvent.title}" updated.`)
      } else {
        // Create mode
        const goLiveAt = newEvent.goLiveDate
          ? new Date(`${newEvent.goLiveDate}T${newEvent.goLiveTime || '00:00'}`).toISOString()
          : undefined
        await createEvent(adminKey, {
          id: eventId,
          title: newEvent.title,
          date: newEvent.date,
          ...(newEvent.startTime ? { startTime: newEvent.startTime } : {}),
          ...(newEvent.endTime ? { endTime: newEvent.endTime } : {}),
          ...(newEvent.location ? { location: newEvent.location } : {}),
          ...(flyerUrl ? { flyerUrl } : {}),
          ...(newEvent.ticketingUrl ? { ticketingUrl: newEvent.ticketingUrl } : {}),
          ...(newEvent.description ? { description: newEvent.description } : {}),
          ...(newEvent.buttonText ? { buttonText: newEvent.buttonText } : {}),
          ...(goLiveAt ? { goLiveAt } : {}),
        })
        setEvents((prev) => [...prev, {
          id: eventId, entity: 'EVENT', title: newEvent.title, date: newEvent.date,
          startTime: newEvent.startTime || null, endTime: newEvent.endTime || null,
          location: newEvent.location || null, flyerUrl: flyerUrl ?? null,
          ticketingUrl: newEvent.ticketingUrl || null, goLiveAt: goLiveAt ?? null,
          description: newEvent.description || null,
          buttonText: newEvent.buttonText || null,
        }])
        setStatusMsg(`Event "${newEvent.title}" created.`)
      }
      resetForm()
    } catch (err) {
      console.error('Save event error:', err)
      setError(editingEventId ? 'Failed to update event.' : 'Failed to create event.')
    } finally {
      setSavingNew(false)
    }
  }

  async function handleDeleteEvent(ev: Event) {
    if (!confirm(`Delete "${ev.title}"? This cannot be undone.`)) return
    setDeleting((prev) => ({ ...prev, [ev.id]: true }))
    setStatusMsg('')
    setError('')
    try {
      await deleteEvent(adminKey, ev.id)
      setEvents((prev) => prev.filter((e) => e.id !== ev.id))
      setStatusMsg(`"${ev.title}" deleted.`)
    } catch (err) {
      console.error('Delete event error:', err)
      setError(`Failed to delete "${ev.title}".`)
      setDeleting((prev) => ({ ...prev, [ev.id]: false }))
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-sm text-gray-400">{events.length} event{events.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setShowAddForm(true)}
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

      {/* Add / Edit Event modal */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) resetForm() }}
        >
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-5 space-y-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-white font-semibold">{editingEventId ? 'Edit Event' : 'New Event'}</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title *</label>
              <input type="text" value={newEvent.title} onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))} placeholder="Beats on the Block" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Event Date *</label>
              <input type="date" value={newEvent.date} onChange={(e) => setNewEvent((p) => ({ ...p, date: e.target.value }))} className={inputCls} />
            </div>
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
              <label className="block text-xs text-gray-400 mb-1">Description (optional — shown on event card)</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                placeholder="Join us for an unforgettable night of music..."
                rows={3}
                className={inputCls + ' resize-none'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Button Text (optional — defaults to "Get Info & Updates")</label>
              <input type="text" value={newEvent.buttonText} onChange={(e) => setNewEvent((p) => ({ ...p, buttonText: e.target.value }))} placeholder="Get Tickets" className={inputCls} />
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
                onClick={handleSaveEvent}
                disabled={savingNew || !newEvent.title || !newEvent.date}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {savingNew
                  ? <><Loader2 size={14} className="animate-spin" /> {editingEventId ? 'Saving…' : 'Creating…'}</>
                  : editingEventId ? 'Save Changes' : 'Create Event'}
              </button>
              <button
                onClick={resetForm}
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
          {events.map((ev) => (
            <div key={ev.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
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
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white text-sm">{ev.title}</p>
                      <p className="text-gray-400 text-xs">{ev.date}</p>
                      <div className="mt-1"><GoLiveBadge goLiveAt={ev.goLiveAt} /></div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStartEdit(ev)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                        title="Edit event"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev)}
                        disabled={deleting[ev.id]}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                        title="Delete event"
                      >
                        {deleting[ev.id] ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
