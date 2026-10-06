import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Photographer, StoreCollection, StorePhoto } from '@shared/types/store'
import { getCollectionPhotos } from '../../../lib/api/adminStore'
import { StoreUploader } from './StoreUploader'

interface Props {
  adminKey: string
  collections: StoreCollection[]
  photographers: Photographer[]
  onUploaded: () => void
}

export function UploadSection({ adminKey, collections, photographers, onUploaded }: Props) {
  const [collectionId, setCollectionId] = useState('')
  const [photos, setPhotos] = useState<StorePhoto[] | null>(null)
  const [error, setError] = useState('')
  const collection = collections.find((c) => c.id === collectionId)

  async function choose(id: string) {
    setCollectionId(id)
    setPhotos(null)
    setError('')
    if (!id) return
    try {
      setPhotos(await getCollectionPhotos(adminKey, id))
    } catch {
      setError('Could not load this collection. Try again.')
    }
  }

  if (collections.length === 0) {
    return <p className="text-sm text-gray-400">Create a collection first under Collections.</p>
  }

  return (
    <div className="space-y-4">
      <label className="block text-xs text-gray-400 space-y-1 max-w-sm">
        <span>Collection</span>
        <select
          value={collectionId}
          onChange={(e) => void choose(e.target.value)}
          className="bg-gray-800 text-white rounded-lg px-3 py-1.5 text-sm border border-gray-700 w-full"
        >
          <option value="">Choose a collection…</option>
          {collections.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </label>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {collection && !photos && !error && (
        <p className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading collection…</p>
      )}
      {collection && photos && (
        <StoreUploader
          key={collection.id}
          adminKey={adminKey}
          collection={collection}
          photographers={photographers}
          existingHashes={new Set(photos.map((p) => p.contentHash))}
          nextSortOrder={photos.reduce((m, p) => Math.max(m, p.sortOrder), 0)}
          onUploaded={onUploaded}
        />
      )}
    </div>
  )
}
