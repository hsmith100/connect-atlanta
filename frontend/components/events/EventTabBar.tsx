import type { Event } from '@shared/types/events'

interface EventTabBarProps {
  events: Event[]
  activeEventId: string | null
  onSelect: (id: string) => void
}

export default function EventTabBar({ events, activeEventId, onSelect }: EventTabBarProps) {
  if (events.length < 2) return null

  return (
    <div className="flex gap-2 mb-8 max-w-lg mx-auto">
      {events.map((event) => (
        <button
          key={event.id}
          onClick={() => onSelect(event.id)}
          aria-pressed={activeEventId === event.id}
          className={`flex-1 py-2.5 px-4 rounded-full font-bold text-sm transition-all duration-200 ${
            activeEventId === event.id
              ? 'bg-brand-header text-white shadow-md'
              : 'bg-white/60 text-brand-header hover:bg-white/90 border border-brand-header/20'
          }`}
        >
          {event.title}
        </button>
      ))}
    </div>
  )
}
