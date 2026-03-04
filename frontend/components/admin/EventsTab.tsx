import { useState } from 'react'
import { Trash2, Upload, Save, Loader2, AlertCircle, ImageIcon, Plus } from 'lucide-react'
import { presignFlyer, updateEventFlyer, updateEventGoLive, createEvent, deleteEvent } from '../../lib/api'
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
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
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

  async function handleFlyerUpload(ev: Event, file: File) {
    setUploading((prev) => ({ ...prev, [ev.id]: true }))
    setStatusMsg('')
    setError('')
    try {
      const { uploadUrl, flyerUrl } = await presignFlyer(adminKey, ev.id, file.name, file.type || 'image/jpeg')
      const res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'image/jpeg' } })
      if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`)
      await updateEventFlyer(adminKey, ev.id, flyerUrl)
      setEvents((prev) => prev.map((e) => e.id === ev.id ? { ...e, flyerUrl } : e))
      setStatusMsg(`Flyer updated for "${ev.title}".`)
    } catch (err) {
      console.error('Flyer upload error:', err)
      setError(`Failed to upload flyer for "${ev.title}".`)
    } finally {
      setUploading((prev) => ({ ...prev, [ev.id]: false }))
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
                    <button
                      onClick={() => handleDeleteEvent(ev)}
                      disabled={deleting[ev.id]}
                      className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                      title="Delete event"
                    >
                      {deleting[ev.id] ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                  <label className={`flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-semibold cursor-pointer transition-colors ${uploading[ev.id] ? 'bg-gray-700 opacity-50 cursor-wait' : 'bg-brand-primary hover:bg-brand-primary/90'} text-white`}>
                    {uploading[ev.id] ? (
                      <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                    ) : (
                      <><Upload size={14} /> {ev.flyerUrl ? 'Replace flyer' : 'Upload flyer'}</>
                    )}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading[ev.id]} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFlyerUpload(ev, file); e.target.value = '' }} />
                  </label>
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
