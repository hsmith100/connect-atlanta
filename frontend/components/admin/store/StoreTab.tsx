import { useState } from 'react'

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
}

// Each sub-section is filled in by its user story phase (specs/009-photo-store/tasks.md).
export function StoreTab({ adminKey: _adminKey }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('collections')
  const activeLabel = SUB_TABS.find((t) => t.id === activeSubTab)?.label

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
        <p data-testid={`store-${activeSubTab}`} className="text-gray-400 text-sm">
          {activeLabel} — coming soon.
        </p>
      </div>
    </div>
  )
}
