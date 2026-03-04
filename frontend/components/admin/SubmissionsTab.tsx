import { useState } from 'react'
import { ArtistsSection } from './submissions/ArtistsSection'
import { SponsorsSection } from './submissions/SponsorsSection'
import { EmailSignupsSection } from './submissions/EmailSignupsSection'
import type { Submission } from './submissions/shared'

type SubTab = 'artists' | 'sponsors' | 'signups'

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'artists',  label: 'DJ Applications' },
  { id: 'sponsors', label: 'Sponsor Inquiries' },
  { id: 'signups',  label: 'Contacts & Signups' },
]

interface Props {
  adminKey: string
  artists: Submission[]
  sponsors: Submission[]
  emailSignups: Submission[]
}

export function SubmissionsTab({ adminKey, artists, sponsors, emailSignups }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('artists')

  return (
    <div className="max-w-5xl mx-auto">
      {/* Sub-tab nav */}
      <div className="flex gap-1 px-6 border-b border-gray-800">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
              activeSubTab === tab.id
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeSubTab === 'artists'  && <ArtistsSection artists={artists} />}
        {activeSubTab === 'sponsors' && <SponsorsSection sponsors={sponsors} adminKey={adminKey} />}
        {activeSubTab === 'signups'  && <EmailSignupsSection signups={emailSignups} />}
      </div>
    </div>
  )
}
