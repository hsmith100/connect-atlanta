import { Users, Store, Music, Building2 } from 'lucide-react'

export type JoinTab = 'volunteer' | 'vendor' | 'dj' | 'sponsor'

interface JoinTabBarProps {
  activeTab: JoinTab
  isHeaderVisible: boolean
  onTabSelect: (tab: JoinTab) => void
}

const TABS: { id: JoinTab; label: string; Icon: typeof Music }[] = [
  { id: 'volunteer', label: 'Volunteer', Icon: Users },
  { id: 'vendor',    label: 'Vendor',    Icon: Store },
  { id: 'dj',       label: 'DJ',        Icon: Music },
  { id: 'sponsor',   label: 'Sponsor',   Icon: Building2 },
]

export default function JoinTabBar({ activeTab, isHeaderVisible, onTabSelect }: JoinTabBarProps) {
  return (
    <div className={`sticky z-40 bg-brand-bg/80 backdrop-blur-sm border-b-2 border-brand-neutral-100 transition-all duration-300 ${isHeaderVisible ? 'top-28' : 'top-0'} md:top-[3.5rem]`}>
      <div className="section-container py-0">
        <div className="flex justify-center">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onTabSelect(id)}
              className={`flex items-center gap-1 md:gap-2 px-3 md:px-8 py-4 font-title font-bold text-sm md:text-lg transition-all ${
                activeTab === id
                  ? 'text-brand-primary border-b-4 border-brand-primary bg-brand-bg/30'
                  : 'text-brand-text/60 hover:text-brand-primary hover:bg-brand-bg/20'
              }`}
            >
              <Icon size={18} className="md:w-5 md:h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
