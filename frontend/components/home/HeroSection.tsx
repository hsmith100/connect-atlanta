import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, Calendar } from 'lucide-react'
import type { HeroCard } from '@shared/types/heroCards'
import type { Event } from '@shared/types/events'
import { HeroCardVisual } from '../shared/HeroCardVisual'
import EventTabBar from '../events/EventTabBar'
import UpcomingEventCard from '../events/UpcomingEventCard'
import { getDefaultActiveId } from '../../lib/formatters'

const STAGGER_DELAYS = ['0s', '0.15s', '0.3s', '0.45s', '0.6s']

interface HeroSectionProps {
  readonly heroCards: HeroCard[]
  readonly heroCardsLoading: boolean
  readonly upcomingEvents: Event[]
  readonly eventsLoading: boolean
  readonly onOpenModal: () => void
}

export default function HeroSection({
  heroCards,
  heroCardsLoading,
  upcomingEvents,
  eventsLoading,
  onOpenModal,
}: HeroSectionProps) {
  const [activeEventId, setActiveEventId] = useState<string | null>(null)

  useEffect(() => {
    setActiveEventId(getDefaultActiveId(upcomingEvents))
  }, [upcomingEvents])

  const activeEvent = upcomingEvents.find(e => e.id === activeEventId) ?? upcomingEvents[0]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-8 hero-gradient-gold">
      <div className="section-container relative z-10 w-full">

        {/* Hero Logo & Title - Desktop Only */}
        <div className="text-center mb-12 md:mb-16 hidden md:block">
          <div className="relative inline-block mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-radial from-yellow-200/40 via-yellow-100/20 to-transparent blur-3xl scale-110"></div>
            <img
              src="/images/ConnectLogoBIG-Black.svg"
              alt="Connect"
              className="relative w-auto h-48 mx-auto"
            />
          </div>
          <h1 className="font-slogan text-3xl md:text-4xl lg:text-5xl text-brand-text tracking-wider uppercase mb-4">
            Home of Beats on the Beltline
          </h1>
        </div>

        {/* Dynamic content: upcoming event OR hero cards */}
        {eventsLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-brand-primary" size={40} />
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="max-w-5xl mx-auto">
            <EventTabBar
              events={upcomingEvents}
              activeEventId={activeEventId}
              onSelect={setActiveEventId}
            />
            {activeEvent && <UpcomingEventCard key={activeEvent.id} event={activeEvent} />}
            {heroCardsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-brand-primary" size={40} />
              </div>
            ) : heroCards.length > 0 && (
              <div className="flex flex-col md:flex-row md:justify-center gap-4 max-w-7xl mx-auto mt-10">
                {heroCards.map((card, i) =>
                  card.linkUrl.startsWith('http') ? (
                    <a
                      key={card.id}
                      href={card.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full md:flex-1 md:min-w-0"
                      style={{ animation: `fadeInUp 0.6s ease-out ${STAGGER_DELAYS[i] ?? '0s'} both` }}
                    >
                      <HeroCardVisual card={card} />
                    </a>
                  ) : (
                    <Link
                      key={card.id}
                      href={card.linkUrl}
                      className="block h-full md:flex-1 md:min-w-0"
                      style={{ animation: `fadeInUp 0.6s ease-out ${STAGGER_DELAYS[i] ?? '0s'} both` }}
                    >
                      <HeroCardVisual card={card} />
                    </Link>
                  )
                )}
              </div>
            )}
          </div>
        ) : heroCardsLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-brand-primary" size={40} />
          </div>
        ) : heroCards.length > 0 ? (
          <div className="flex flex-col md:flex-row md:justify-center gap-4 max-w-7xl mx-auto">
            {heroCards.map((card, i) =>
              card.linkUrl.startsWith('http') ? (
                <a
                  key={card.id}
                  href={card.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full md:flex-1 md:min-w-0"
                  style={{ animation: `fadeInUp 0.6s ease-out ${STAGGER_DELAYS[i] ?? '0s'} both` }}
                >
                  <HeroCardVisual card={card} />
                </a>
              ) : (
                <Link
                  key={card.id}
                  href={card.linkUrl}
                  className="block h-full md:flex-1 md:min-w-0"
                  style={{ animation: `fadeInUp 0.6s ease-out ${STAGGER_DELAYS[i] ?? '0s'} both` }}
                >
                  <HeroCardVisual card={card} />
                </Link>
              )
            )}
          </div>
        ) : (
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
        )}
      </div>
    </section>
  )
}
