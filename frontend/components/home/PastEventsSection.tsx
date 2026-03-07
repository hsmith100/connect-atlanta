import { useState } from 'react'
import Link from 'next/link'
import type { Event } from '@shared/types/events'
import EventFlyerCard from '../events/EventFlyerCard'
import FlyerModal from '../events/FlyerModal'

interface PastEventsSectionProps {
  events: Event[]
  loading: boolean
}

export default function PastEventsSection({ events, loading }: PastEventsSectionProps) {
  const [selectedFlyerIndex, setSelectedFlyerIndex] = useState<number | null>(null)

  return (
    <>
      <section className="py-6 md:py-10 bg-brand-bg">
        <div className="section-container">
          <h2 className="font-title text-5xl md:text-7xl font-black text-center mb-10 text-brand-header uppercase">
            PAST EVENTS
          </h2>

          {!loading && events.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {events.map((event, index) => (
                  <EventFlyerCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedFlyerIndex(index)}
                  />
                ))}
              </div>
              <div className="text-center mt-10">
                <Link href="/events" className="btn-festival-outline btn-lg">
                  View all events →
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <FlyerModal
        events={events}
        selectedIndex={selectedFlyerIndex}
        onClose={() => setSelectedFlyerIndex(null)}
        onPrev={() => setSelectedFlyerIndex(i => i !== null ? (i - 1 + events.length) % events.length : null)}
        onNext={() => setSelectedFlyerIndex(i => i !== null ? (i + 1) % events.length : null)}
      />
    </>
  )
}
