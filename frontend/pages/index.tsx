import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ConnectModal from '../components/ConnectModal'
import { organizationSchema, websiteSchema, eventSeriesSchema, faqSchema } from '../lib/structuredData'
import { getEvents, getHeroCards } from '../lib/api'
import type { Event } from '@shared/types/events'
import type { HeroCard } from '@shared/types/heroCards'
import HeroSection from '../components/home/HeroSection'
import ExperienceSection from '../components/home/ExperienceSection'
import UpcomingEventsSection from '../components/home/UpcomingEventsSection'
import PastEventsSection from '../components/home/PastEventsSection'
import SponsorsSection from '../components/home/SponsorsSection'
import ConnectSection from '../components/home/ConnectSection'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [heroCards, setHeroCards] = useState<HeroCard[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [pastEvents, setPastEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  useEffect(() => {
    getHeroCards().then(setHeroCards).catch(err => console.error('Failed to load hero cards:', err))
  }, [])

  useEffect(() => {
    async function loadEvents() {
      try {
        const events = await getEvents()
        const today = new Date().toISOString().slice(0, 10)
        setUpcomingEvents(events.filter(e => e.date >= today))
        setPastEvents(
          events
            .filter(e => e.date < today)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 4)
        )
      } catch (err) {
        console.error('Failed to load events:', err)
      } finally {
        setEventsLoading(false)
      }
    }
    loadEvents()
  }, [])

  return (
    <>
      <SEO
        title="Beats on the Beltline | Atlanta's Premier Free Outdoor Electronic Music Experience"
        description="Atlanta's premier free outdoor electronic music festival. Join 5,000-10,000 attendees for world-class DJs, local vendors, and community vibes along the Beltline."
        keywords="beats on the beltline, atlanta music festival, beltline, electronic music, free festival, atlanta edm, house music, techno"
        canonicalUrl="https://connectevents.co"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [organizationSchema, websiteSchema, eventSeriesSchema, faqSchema]
        }}
      />

      <div className="min-h-screen bg-brand-bg">
        <Header />
        <HeroSection heroCards={heroCards} />
        <ConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <ExperienceSection />
        <UpcomingEventsSection
          events={upcomingEvents}
          loading={eventsLoading}
          onOpenModal={() => setIsModalOpen(true)}
        />
        <PastEventsSection events={pastEvents} loading={eventsLoading} />
        <SponsorsSection />
        <ConnectSection />
        <Footer />
      </div>
    </>
  )
}
