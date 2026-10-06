import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import type { Event } from '@shared/types/events'
import type { Photographer, StoreCollection } from '@shared/types/store'
import { createStoreCollection } from '../../../lib/api/adminStore'
import { formatMoney } from '../../../lib/store/formatMoney'
import { CollectionDetail, dollarsToCents } from './CollectionDetail'

interface Props {
  adminKey: string
  events: Event[]
  photographers: Photographer[]
  collections: StoreCollection[]
  setCollections: React.Dispatch<React.SetStateAction<StoreCollection[]>>
  reloadCollections: () => Promise<void>
}

const inputClass = 'bg-gray-800 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-700 w-full'

export function CollectionsSection({ adminKey, events, photographers, collections, setCollections, reloadCollections }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [eventId, setEventId] = useState('')
  const [price, setPrice] = useState('15.00')
  const [error, setError] = useState('')

  const usedEventIds = new Set(collections.map((c) => c.eventId))
  const availableEvents = events.filter((e) => !usedEventIds.has(e.id))
  const selected = collections.find((c) => c.id === selectedId)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const cents = dollarsToCents(price)
    if (!eventId) { setError('Choose an event.'); return }
    if (cents === null) { setError('Default price must be at least $0.50.'); return }
    setCreating(true)
    setError('')
    try {
      const created = await createStoreCollection(adminKey, { eventId, defaultPriceCents: cents })
      setCollections((prev) => [created, ...prev].sort((a, b) => b.eventDate.localeCompare(a.eventDate)))
      setEventId('')
      setSelectedId(created.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create collection.')
    } finally {
      setCreating(false)
    }
  }

  if (selected) {
    return (
      <CollectionDetail
        adminKey={adminKey}
        collection={selected}
        photographers={photographers}
        onChange={(updated) => setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))}
        onRefresh={() => void reloadCollections()}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] items-end">
        <label className="text-xs text-gray-400 space-y-1">
          <span>Event</span>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={inputClass}>
            <option value="">Choose an event…</option>
            {availableEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.title} ({ev.date})</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-400 space-y-1">
          <span>Default price ($)</span>
          <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg px-4 py-1.5 text-sm font-semibold disabled:opacity-50"
        >
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          New collection
        </button>
      </form>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      {collections.length === 0 ? (
        <p className="text-sm text-gray-400">No photo collections yet. Create one for an event to start selling photos.</p>
      ) : (
        <ul className="divide-y divide-gray-900">
          {collections.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setSelectedId(c.id)}
                className="w-full flex flex-wrap items-center gap-3 py-3 text-left hover:bg-gray-900 px-2 rounded-lg"
              >
                <span className="flex-1 min-w-[12rem]">
                  <span className="block text-white font-semibold">{c.title}</span>
                  <span className="block text-xs text-gray-400">{c.eventDate} · {formatMoney(c.defaultPriceCents)} each</span>
                </span>
                <span className="text-sm text-gray-300">{c.photoCount} for sale</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'published' ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
                  {c.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
