import { useRef, useState } from 'react'
import { Upload, Loader2, RotateCcw } from 'lucide-react'
import type { Photographer, StoreCollection } from '@shared/types/store'
import { hashFile } from '../../../lib/store/hashFile'
import { uploadStorePhoto } from '../../../lib/store/uploadStorePhoto'

const CONCURRENCY = 3
const SORT_STEP = 10

type RowStatus = 'queued' | 'processing' | 'done' | 'failed' | 'duplicate'

interface Row {
  key: number
  file: File
  status: RowStatus
  error?: string
}

interface Props {
  adminKey: string
  collection: StoreCollection
  photographers: Photographer[]
  existingHashes: Set<string>
  nextSortOrder: number
  onUploaded: () => void
}

const STATUS_LABEL: Record<RowStatus, string> = {
  queued: 'Queued',
  processing: 'Processing…',
  done: 'Done',
  failed: 'Failed',
  duplicate: 'Duplicate',
}

const STATUS_CLASS: Record<RowStatus, string> = {
  queued: 'text-gray-400',
  processing: 'text-blue-300',
  done: 'text-green-400',
  failed: 'text-red-400',
  duplicate: 'text-yellow-400',
}

export function StoreUploader({ adminKey, collection, photographers, existingHashes, nextSortOrder, onUploaded }: Props) {
  const active = photographers.filter((p) => p.active)
  const [photographerId, setPhotographerId] = useState(
    collection.defaultPhotographerId && active.some((p) => p.id === collection.defaultPhotographerId)
      ? collection.defaultPhotographerId
      : '',
  )
  const [rows, setRows] = useState<Row[]>([])
  const [running, setRunning] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const keyRef = useRef(0)
  const sortRef = useRef(nextSortOrder)
  const seenHashes = useRef(new Set(existingHashes))
  // Hashes currently uploading — catches duplicates within a batch without blocking a retry after failure.
  const inFlightHashes = useRef(new Set<string>())

  function update(key: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  async function processRow(row: Row, force: boolean): Promise<boolean> {
    update(row.key, { status: 'processing', error: undefined })
    let hash: string | null = null
    try {
      hash = await hashFile(row.file)
      if (!force && (seenHashes.current.has(hash) || inFlightHashes.current.has(hash))) {
        update(row.key, { status: 'duplicate' })
        return false
      }
      inFlightHashes.current.add(hash)
      sortRef.current += SORT_STEP
      await uploadStorePhoto(row.file, hash, {
        adminKey, collectionId: collection.id, photographerId, sortOrder: sortRef.current,
      })
      seenHashes.current.add(hash)
      update(row.key, { status: 'done' })
      return true
    } catch (err) {
      update(row.key, { status: 'failed', error: err instanceof Error ? err.message : 'Upload failed' })
      return false
    } finally {
      if (hash) inFlightHashes.current.delete(hash)
    }
  }

  async function run(queue: Row[], force = false) {
    setRunning(true)
    let uploadedAny = false
    let next = 0
    const worker = async () => {
      while (next < queue.length) {
        const row = queue[next++]
        if (await processRow(row, force)) uploadedAny = true
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))
    setRunning(false)
    if (uploadedAny) onUploaded()
  }

  function addFiles(list: FileList | null) {
    const files = Array.from(list ?? []).filter((f) => f.type === 'image/jpeg' || f.type === 'image/png' || /\.(jpe?g|png)$/i.test(f.name))
    if (files.length === 0 || !photographerId) return
    const newRows = files.map((file) => ({ key: ++keyRef.current, file, status: 'queued' as RowStatus }))
    setRows((prev) => [...prev, ...newRows])
    void run(newRows)
    if (inputRef.current) inputRef.current.value = ''
  }

  const done = rows.filter((r) => r.status === 'done').length
  const finished = rows.filter((r) => r.status === 'done' || r.status === 'failed' || r.status === 'duplicate').length

  return (
    <div className="space-y-4">
      <label className="block text-xs text-gray-400 space-y-1 max-w-xs">
        <span>Photographer for this batch</span>
        <select
          value={photographerId}
          onChange={(e) => setPhotographerId(e.target.value)}
          disabled={running}
          className="bg-gray-800 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-700 w-full"
        >
          <option value="">Choose a photographer…</option>
          {active.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.commissionPct}%)</option>)}
        </select>
      </label>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? 'border-brand-pink bg-gray-900' : 'border-gray-700'
        } ${photographerId ? '' : 'opacity-50'}`}
      >
        <Upload className="mx-auto mb-2 text-gray-400" size={28} />
        <p className="text-sm text-gray-300 mb-3">
          {photographerId ? 'Drag full-quality JPEG or PNG photos here' : 'Choose a photographer first'}
        </p>
        <label className={`inline-flex items-center gap-2 bg-brand-primary text-white rounded-lg px-4 py-1.5 text-sm font-semibold ${photographerId ? 'cursor-pointer hover:bg-brand-primary/90' : 'pointer-events-none'}`}>
          Choose files
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png"
            className="hidden"
            disabled={!photographerId}
            onChange={(e) => addFiles(e.target.files)}
            aria-label="Choose photos to upload"
          />
        </label>
        <p className="text-xs text-gray-500 mt-3">Watermarked previews are created automatically. Originals stay private.</p>
      </div>

      {rows.length > 0 && (
        <div>
          <p className="text-sm text-gray-300 mb-2 flex items-center gap-2">
            {running && <Loader2 size={14} className="animate-spin" />}
            {done} / {rows.length} uploaded{finished === rows.length && !running ? ' — finished' : ''}
          </p>
          <ul className="divide-y divide-gray-900 text-sm max-h-80 overflow-y-auto">
            {rows.map((r) => (
              <li key={r.key} className="py-1.5 flex items-center gap-3">
                <span className="flex-1 truncate text-gray-200">{r.file.name}</span>
                <span className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</span>
                {r.status === 'failed' && (
                  <>
                    <span className="text-xs text-red-300 truncate max-w-[40%]" title={r.error}>{r.error}</span>
                    <button type="button" onClick={() => void run([r])} disabled={running} className="flex items-center gap-1 text-xs text-gray-300 hover:text-white">
                      <RotateCcw size={12} /> Retry
                    </button>
                  </>
                )}
                {r.status === 'duplicate' && (
                  <button type="button" onClick={() => void run([r], true)} disabled={running} className="text-xs text-gray-300 hover:text-white">
                    Upload anyway
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
