import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Event } from '@shared/types/events'
import type { Photographer, PhotoCollection } from '@shared/types/store'
import { getPhotoCollections } from '../../../lib/api/adminLibrary'
import { getPhotographers } from '../../../lib/api/adminStore'
import { CollectionsSection } from './CollectionsSection'
import { GalleryOrderSection } from './GalleryOrderSection'

type SubTab = 'collections' | 'gallery'

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'collections', label: 'Collections' },
  { id: 'gallery',     label: 'Gallery order' },
]

interface Props {
  adminKey: string
  events: Event[]
}

// The single photo library: every photo belongs to an event's collection and can be
// shown in the Gallery, sold in the Shop, both or neither.
export function LibraryTab({ adminKey, events }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('collections')
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [collections, setCollections] = useState<PhotoCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reloadCollections = useCallback(async () => {
    setCollections(await getPhotoCollections(adminKey))
  }, [adminKey])

  useEffect(() => {
    Promise.all([getPhotographers(adminKey), getPhotoCollections(adminKey)])
      .then(([p, c]) => { setPhotographers(p); setCollections(c) })
      .catch(() => setError('Could not load photos. Refresh to try again.'))
      .finally(() => setLoading(false))
  }, [adminKey])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex gap-1 px-6 border-b border-gray-800 overflow-x-auto">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeSubTab === tab.id
                ? 'border-brand-primary text-brand-pink'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading photos…</p>
        ) : error ? (
          <p role="alert" className="text-sm text-red-400">{error}</p>
        ) : activeSubTab === 'collections' ? (
          <CollectionsSection
            adminKey={adminKey}
            events={events}
            photographers={photographers}
            collections={collections}
            setCollections={setCollections}
            reloadCollections={reloadCollections}
          />
        ) : (
          <GalleryOrderSection adminKey={adminKey} collections={collections} />
        )}
      </div>
    </div>
  )
}
