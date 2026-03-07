import { useState, useEffect } from 'react'
import { Calendar, Loader2 } from 'lucide-react'
import type { Event } from '@shared/types/events'
import { getDefaultActiveId } from '../../lib/formatters'
import EventTabBar from '../events/EventTabBar'
import UpcomingEventCard from '../events/UpcomingEventCard'

interface UpcomingEventsSectionProps {
  events: Event[]
  loading: boolean
  onOpenModal: () => void
}

export default function UpcomingEventsSection({ events, loading, onOpenModal }: UpcomingEventsSectionProps) {
  const [activeEventId, setActiveEventId] = useState<string | null>(null)

  useEffect(() => {
    setActiveEventId(getDefaultActiveId(events))
  }, [events])

  return (
    <section id="events" className="py-6 md:py-10 bg-brand-bg">
      <div className="section-container">
        <h2 className="font-title text-5xl md:text-7xl font-black text-center mb-10 text-brand-header uppercase">
          Upcoming Events
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-brand-primary" size={40} />
          </div>
        ) : events.length === 0 ? (
          <div className="max-w-3xl mx-auto text-center py-8">
            <div className="mb-6 text-brand-primary/40 flex justify-center">
              <Calendar size={72} strokeWidth={1.5} />
            </div>
            <p className="text-xl text-brand-header/60 mb-6">New events coming soon!</p>
            <button
              onClick={onOpenModal}
              className="bg-brand-header text-white hover:bg-brand-primary hover:text-brand-header font-bold px-10 py-3 rounded-lg text-lg uppercase transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Join Our Mailing List
            </button>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <EventTabBar
              events={events}
              activeEventId={activeEventId}
              onSelect={setActiveEventId}
            />
            {(() => {
              const active = events.find(e => e.id === activeEventId) ?? events[0]
              return active ? <UpcomingEventCard key={active.id} event={active} /> : null
            })()}
          </div>
        )}
      </div>
    </section>
  )
}
