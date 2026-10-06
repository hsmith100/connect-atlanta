import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Event } from '@shared/types/events'
import type { Photographer, StoreCollection } from '@shared/types/store'
import { getPhotographers, getStoreCollections } from '../../../lib/api/adminStore'
import { CollectionsSection } from './CollectionsSection'
import { PhotographersSection } from './PhotographersSection'
import { UploadSection } from './UploadSection'

type SubTab = 'collections' | 'upload' | 'orders' | 'photographers' | 'settings'

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'collections',   label: 'Collections' },
  { id: 'upload',        label: 'Upload' },
  { id: 'orders',        label: 'Orders' },
  { id: 'photographers', label: 'Photographers' },
  { id: 'settings',      label: 'Settings' },
]

interface Props {
  adminKey: string
  events: Event[]
}

export function StoreTab({ adminKey, events }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('collections')
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [collections, setCollections] = useState<StoreCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reloadCollections = useCallback(async () => {
    setCollections(await getStoreCollections(adminKey))
  }, [adminKey])

  useEffect(() => {
    Promise.all([getPhotographers(adminKey), getStoreCollections(adminKey)])
      .then(([p, c]) => { setPhotographers(p); setCollections(c) })
      .catch(() => setError('Could not load the store. Refresh to try again.'))
      .finally(() => setLoading(false))
  }, [adminKey])

  return (
    <div className="max-w-5xl mx-auto">
      {/* Sub-tab nav */}
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
          <p className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading store…</p>
        ) : error ? (
          <p role="alert" className="text-sm text-red-400">{error}</p>
        ) : (
          <>
            {activeSubTab === 'collections' && (
              <CollectionsSection
                adminKey={adminKey}
                events={events}
                photographers={photographers}
                collections={collections}
                setCollections={setCollections}
                reloadCollections={reloadCollections}
              />
            )}
            {activeSubTab === 'upload' && (
              <UploadSection
                adminKey={adminKey}
                collections={collections}
                photographers={photographers}
                onUploaded={() => void reloadCollections()}
              />
            )}
            {activeSubTab === 'photographers' && (
              <PhotographersSection adminKey={adminKey} photographers={photographers} setPhotographers={setPhotographers} />
            )}
            {(activeSubTab === 'orders' || activeSubTab === 'settings') && (
              <p data-testid={`store-${activeSubTab}`} className="text-gray-400 text-sm">
                {activeSubTab === 'orders' ? 'Orders' : 'Settings'} — coming soon.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
