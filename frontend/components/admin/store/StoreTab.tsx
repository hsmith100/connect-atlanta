import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Photographer } from '@shared/types/store'
import { getPhotographers } from '../../../lib/api/adminStore'
import { PhotographersSection } from './PhotographersSection'

type SubTab = 'orders' | 'photographers' | 'settings'

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'orders',        label: 'Orders' },
  { id: 'photographers', label: 'Photographers' },
  { id: 'settings',      label: 'Settings' },
]

interface Props {
  adminKey: string
}

// Selling only. Photos themselves (gallery and for-sale) are managed in the Photos tab.
export function StoreTab({ adminKey }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('orders')
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getPhotographers(adminKey)
      .then(setPhotographers)
      .catch(() => setError('Could not load the store. Refresh to try again.'))
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
          <p className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading store…</p>
        ) : error ? (
          <p role="alert" className="text-sm text-red-400">{error}</p>
        ) : activeSubTab === 'photographers' ? (
          <PhotographersSection adminKey={adminKey} photographers={photographers} setPhotographers={setPhotographers} />
        ) : (
          <p data-testid={`store-${activeSubTab}`} className="text-gray-400 text-sm">
            {activeSubTab === 'orders' ? 'Orders' : 'Settings'} — coming soon.
          </p>
        )}
      </div>
    </div>
  )
}
