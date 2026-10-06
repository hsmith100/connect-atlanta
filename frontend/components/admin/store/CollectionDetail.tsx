import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowUp, ArrowDown, Loader2, Star } from 'lucide-react'
import type { Photographer, StoreCollection, StorePhoto, StorePhotoUpdatePayload } from '@shared/types/store'
import {
  getCollectionPhotos, updateStoreCollection, updateStorePhotos, deleteStorePhotos,
} from '../../../lib/api/adminStore'
import { ApiError } from '../../../lib/api/client'
import { formatMoney } from '../../../lib/store/formatMoney'
import { replaceStorePhoto } from '../../../lib/store/uploadStorePhoto'
import { StoreUploader } from './StoreUploader'

interface Props {
  adminKey: string
  collection: StoreCollection
  photographers: Photographer[]
  onChange: (collection: StoreCollection) => void
  // Reload the collection from the server (photoCount changes after uploads, hides and deletes).
  onRefresh: () => void
  onBack: () => void
}

const inputClass = 'bg-gray-800 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-700 w-full'
const buttonClass = 'text-xs font-semibold rounded-lg px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 disabled:opacity-50'

export function dollarsToCents(value: string): number | null {
  const n = Number(value.replace(/^\$/, ''))
  return value.trim() !== '' && Number.isFinite(n) && n >= 0.5 ? Math.round(n * 100) : null
}

export function CollectionDetail({ adminKey, collection, photographers, onChange, onRefresh, onBack }: Props) {
  const [photos, setPhotos] = useState<StorePhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [problems, setProblems] = useState<string[]>([])
  const [statusMsg, setStatusMsg] = useState('')
  const [title, setTitle] = useState(collection.title)
  const [price, setPrice] = useState((collection.defaultPriceCents / 100).toFixed(2))
  const [defaultPhotographerId, setDefaultPhotographerId] = useState(collection.defaultPhotographerId ?? '')
  const [overridePrice, setOverridePrice] = useState('')
  const [bulkPhotographerId, setBulkPhotographerId] = useState('')
  const [showUploader, setShowUploader] = useState(false)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const replaceTargetRef = useRef<string | null>(null)

  const photographerName = useMemo(() => new Map(photographers.map((p) => [p.id, p.name])), [photographers])
  const activePhotographers = photographers.filter((p) => p.active)
  const visible = photos.filter((p) => p.status !== 'removed')

  const loadPhotos = useCallback(async () => {
    setLoading(true)
    try {
      setPhotos(await getCollectionPhotos(adminKey, collection.id))
    } catch {
      setError('Could not load photos for this collection.')
    } finally {
      setLoading(false)
    }
  }, [adminKey, collection.id])

  useEffect(() => { void loadPhotos() }, [loadPhotos])

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true)
    setError('')
    setStatusMsg('')
    try {
      await action()
      setStatusMsg(success)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function saveSettings() {
    const cents = dollarsToCents(price)
    if (cents === null) { setError('Default price must be at least $0.50.'); return }
    if (!title.trim()) { setError('Title is required.'); return }
    void run(async () => {
      onChange(await updateStoreCollection(adminKey, collection.id, {
        title: title.trim(), defaultPriceCents: cents, defaultPhotographerId: defaultPhotographerId || null,
      }))
    }, 'Settings saved.')
  }

  async function togglePublish() {
    const status = collection.status === 'published' ? 'draft' : 'published'
    setProblems([])
    setBusy(true)
    setError('')
    setStatusMsg('')
    try {
      onChange(await updateStoreCollection(adminKey, collection.id, { status }))
      setStatusMsg(status === 'published' ? 'Published — visible in the Shop.' : 'Unpublished — hidden from the Shop.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && Array.isArray(err.data.problems)) {
        setProblems(err.data.problems as string[])
      } else {
        setError(err instanceof Error ? err.message : 'Could not change publish status.')
      }
    } finally {
      setBusy(false)
    }
  }

  function bulkUpdate(patch: Omit<StorePhotoUpdatePayload, 'id'>, success: string) {
    const ids = [...selected]
    if (ids.length === 0) return
    void run(async () => {
      await updateStorePhotos(adminKey, ids.map((id) => ({ id, ...patch })))
      setPhotos((prev) => prev.map((p) => (selected.has(p.id) ? { ...p, ...patch } as StorePhoto : p)))
      setSelected(new Set())
      if (patch.status) onRefresh()
    }, success)
  }

  function applyOverride() {
    const cents = dollarsToCents(overridePrice)
    if (cents === null) { setError('Price must be at least $0.50.'); return }
    bulkUpdate({ priceOverrideCents: cents }, `Price set to ${formatMoney(cents)}.`)
  }

  function deleteSelected() {
    const ids = [...selected]
    if (ids.length === 0 || !window.confirm(`Permanently delete ${ids.length} photo(s), including their originals?`)) return
    void run(async () => {
      const { deleted, skipped } = await deleteStorePhotos(adminKey, ids)
      setSelected(new Set())
      await loadPhotos()
      onRefresh()
      if (skipped.length) throw new Error(`${deleted} deleted; ${skipped.length} could not be deleted.`)
    }, 'Photos deleted.')
  }

  function setCover() {
    const [id] = [...selected]
    void run(async () => {
      onChange(await updateStoreCollection(adminKey, collection.id, { coverPhotoId: id }))
      setSelected(new Set())
    }, 'Cover photo set.')
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= visible.length) return
    const a = visible[index]
    const b = visible[target]
    void run(async () => {
      await updateStorePhotos(adminKey, [{ id: a.id, sortOrder: b.sortOrder }, { id: b.id, sortOrder: a.sortOrder }])
      setPhotos((prev) => prev
        .map((p) => (p.id === a.id ? { ...p, sortOrder: b.sortOrder } : p.id === b.id ? { ...p, sortOrder: a.sortOrder } : p))
        .sort((x, y) => x.sortOrder - y.sortOrder))
    }, 'Order saved.')
  }

  function startReplace(id: string) {
    replaceTargetRef.current = id
    replaceInputRef.current?.click()
  }

  function handleReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const id = replaceTargetRef.current
    e.target.value = ''
    if (!file || !id) return
    void run(async () => {
      const updated = await replaceStorePhoto(file, id, adminKey)
      setPhotos((prev) => prev.map((p) => (p.id === id ? updated : p)))
    }, 'Photo replaced.')
  }

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const maxSort = photos.reduce((m, p) => Math.max(m, p.sortOrder), 0)

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white">
        <ArrowLeft size={14} /> All collections
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">{collection.title}</h2>
          <p className="text-xs text-gray-400">{collection.eventDate} · {collection.photoCount} for sale</p>
        </div>
        <button
          type="button"
          onClick={() => void togglePublish()}
          disabled={busy}
          className={`text-sm font-semibold rounded-lg px-4 py-1.5 disabled:opacity-50 ${
            collection.status === 'published' ? 'bg-gray-700 text-white' : 'bg-green-700 hover:bg-green-600 text-white'
          }`}
        >
          {collection.status === 'published' ? 'Unpublish' : 'Publish'}
        </button>
      </div>

      {problems.length > 0 && (
        <div role="alert" className="rounded-lg border border-yellow-700 bg-yellow-950 p-3 text-sm text-yellow-200">
          <p className="font-semibold mb-1">Not ready to publish:</p>
          <ul className="list-disc ml-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {statusMsg && <p className="text-sm text-green-400">{statusMsg}</p>}

      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] items-end">
        <label className="text-xs text-gray-400 space-y-1">
          <span>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </label>
        <label className="text-xs text-gray-400 space-y-1">
          <span>Default price ($)</span>
          <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
        </label>
        <label className="text-xs text-gray-400 space-y-1">
          <span>Default photographer</span>
          <select value={defaultPhotographerId} onChange={(e) => setDefaultPhotographerId(e.target.value)} className={inputClass}>
            <option value="">None</option>
            {activePhotographers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <button type="button" onClick={saveSettings} disabled={busy} className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg px-4 py-1.5 text-sm font-semibold disabled:opacity-50">
          Save settings
        </button>
      </div>

      <div>
        <button type="button" onClick={() => setShowUploader((v) => !v)} className={buttonClass}>
          {showUploader ? 'Hide uploader' : 'Upload photos'}
        </button>
        {showUploader && (
          <div className="mt-4">
            <StoreUploader
              adminKey={adminKey}
              collection={collection}
              photographers={photographers}
              existingHashes={new Set(photos.map((p) => p.contentHash))}
              nextSortOrder={maxSort}
              onUploaded={() => { void loadPhotos(); onRefresh() }}
            />
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-900 p-3">
          <span className="text-sm text-gray-300 mr-2">{selected.size} selected</span>
          <input
            aria-label="Price override ($)"
            placeholder="Price $"
            inputMode="decimal"
            value={overridePrice}
            onChange={(e) => setOverridePrice(e.target.value)}
            className="bg-gray-800 text-white rounded-lg px-2 py-1 text-xs border border-gray-700 w-20"
          />
          <button type="button" onClick={applyOverride} disabled={busy} className={buttonClass}>Set price</button>
          <button type="button" onClick={() => bulkUpdate({ priceOverrideCents: null }, 'Price override cleared.')} disabled={busy} className={buttonClass}>Use default price</button>
          <select aria-label="Assign photographer" value={bulkPhotographerId} onChange={(e) => setBulkPhotographerId(e.target.value)} className="bg-gray-800 text-white rounded-lg px-2 py-1 text-xs border border-gray-700">
            <option value="">Photographer…</option>
            {activePhotographers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button type="button" onClick={() => bulkPhotographerId && bulkUpdate({ photographerId: bulkPhotographerId }, 'Photographer assigned.')} disabled={busy || !bulkPhotographerId} className={buttonClass}>Assign</button>
          <button type="button" onClick={() => bulkUpdate({ status: 'hidden' }, 'Photos hidden.')} disabled={busy} className={buttonClass}>Hide</button>
          <button type="button" onClick={() => bulkUpdate({ status: 'forSale' }, 'Photos for sale.')} disabled={busy} className={buttonClass}>Unhide</button>
          <button type="button" onClick={setCover} disabled={busy || selected.size !== 1} className={buttonClass}>Set as cover</button>
          <button type="button" onClick={deleteSelected} disabled={busy} className="text-xs font-semibold rounded-lg px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white disabled:opacity-50">Delete</button>
        </div>
      )}

      <input ref={replaceInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleReplaceFile} aria-label="Replacement file" />

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading photos…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-400">No photos yet. Use “Upload photos” to add some.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {visible.map((p, i) => (
            <li key={p.id} className={`rounded-lg overflow-hidden border ${selected.has(p.id) ? 'border-brand-pink' : 'border-gray-800'} bg-gray-900`}>
              <button type="button" onClick={() => toggle(p.id)} aria-pressed={selected.has(p.id)} aria-label={`Select ${p.originalFilename}`} className="relative block w-full">
                <img src={p.thumbnailUrl} alt={p.originalFilename} loading="lazy" className={`w-full aspect-[3/2] object-cover ${p.status === 'hidden' ? 'opacity-40' : ''}`} />
                {collection.coverPhotoId === p.id && <Star size={16} className="absolute top-1 left-1 text-yellow-400" fill="currentColor" aria-label="Cover photo" />}
                {p.status === 'hidden' && <span className="absolute top-1 right-1 text-[10px] bg-gray-800 text-gray-300 px-1.5 rounded">Hidden</span>}
              </button>
              <div className="p-2 text-xs space-y-1">
                <p className="truncate text-gray-300" title={p.originalFilename}>{p.originalFilename}</p>
                <p className="text-gray-400">
                  {formatMoney(p.priceOverrideCents ?? collection.defaultPriceCents)}
                  {p.priceOverrideCents !== null && <span className="ml-1 text-brand-pink">custom</span>}
                  {' · '}{photographerName.get(p.photographerId) ?? 'Unknown'}
                </p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label={`Move ${p.originalFilename} earlier`} className="p-1 text-gray-400 hover:text-white disabled:opacity-30"><ArrowUp size={12} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={busy || i === visible.length - 1} aria-label={`Move ${p.originalFilename} later`} className="p-1 text-gray-400 hover:text-white disabled:opacity-30"><ArrowDown size={12} /></button>
                  <button type="button" onClick={() => startReplace(p.id)} disabled={busy} className="ml-auto text-gray-400 hover:text-white">Replace file</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
