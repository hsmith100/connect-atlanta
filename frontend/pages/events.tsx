import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import SEO from '../components/shared/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ConnectModal from '../components/shared/ConnectModal'
import { Calendar, Music, Loader2, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getEvents, getEventGallery } from '../lib/api'
import type { Event } from '@shared/types/events'
import type { Photo } from '@shared/types/photos'
import { formatEventDate, getEventDatetimes, getDefaultActiveId } from '../lib/formatters'
import UpcomingEventCard from '../components/events/UpcomingEventCard'
import EventFlyerCard from '../components/events/EventFlyerCard'
import FlyerModal from '../components/events/FlyerModal'
import EventTabBar from '../components/events/EventTabBar'

// Matches the actual GET /api/gallery response shape
type EventGalleryData = { photos: Photo[] };

export default function Events() {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
    const [galleryData, setGalleryData] = useState<EventGalleryData | null>(null)
    const [loading, setLoading] = useState(true)
    const [galleryLoading, setGalleryLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [galleryError, setGalleryError] = useState<string | null>(null)
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
    const [pastEvents, setPastEvents] = useState<Event[]>([])
    const [activeEventId, setActiveEventId] = useState<string | null>(null)
    const [selectedFlyerIndex, setSelectedFlyerIndex] = useState<number | null>(null)

    // Load events on mount — split using time-aware logic
    useEffect(() => {
        async function loadEvents() {
            try {
                const events = await getEvents()
                const now = new Date()
                // Upcoming = not yet ended; past = end time has passed
                const upcoming = events
                    .filter(e => now < getEventDatetimes(e).end)
                    .sort((a, b) => getEventDatetimes(a).start.getTime() - getEventDatetimes(b).start.getTime())
                const past = events.filter(e => now >= getEventDatetimes(e).end)
                setUpcomingEvents(upcoming)
                setPastEvents(past)
                setActiveEventId(getDefaultActiveId(upcoming))
            } catch (err) {
                console.error('Failed to load events:', err)
                setError('Failed to load events. Please try again later.')
            } finally {
                setLoading(false)
            }
        }
        loadEvents()
    }, [])

    const handleEventClick = async (eventId: string) => {
        setSelectedEvent(eventId)
        setGalleryData(null)
        setGalleryError(null)
        setGalleryLoading(true)

        // Fetch gallery from API
        try {
            const gallery = await getEventGallery(eventId)
            setGalleryData(gallery)
            setGalleryLoading(false)

            // Scroll to gallery section after data is loaded
            setTimeout(() => {
                document.getElementById('event-gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 100)
        } catch (err) {
            console.error('Failed to load gallery:', err)
            setGalleryError('Failed to load gallery. Please try again.')
            setGalleryLoading(false)
        }
    }

    const handleCloseGallery = () => {
        setSelectedEvent(null)
        // Scroll back to past events section
        setTimeout(() => {
            document.getElementById('past-events')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    // Image modal handlers
    const openImageModal = (index: number) => {
        setSelectedImageIndex(index)
        document.body.style.overflow = 'hidden' // Prevent background scroll
    }

    const closeImageModal = () => {
        setSelectedImageIndex(null)
        document.body.style.overflow = 'unset'
    }

    const nextImage = () => {
        if (galleryData && selectedImageIndex !== null) {
            setSelectedImageIndex((selectedImageIndex + 1) % galleryData.photos.length)
        }
    }

    const prevImage = () => {
        if (galleryData && selectedImageIndex !== null) {
            setSelectedImageIndex((selectedImageIndex - 1 + galleryData.photos.length) % galleryData.photos.length)
        }
    }

    // Keyboard navigation for image modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedImageIndex === null) return

            if (e.key === 'Escape') closeImageModal()
            if (e.key === 'ArrowRight') nextImage()
            if (e.key === 'ArrowLeft') prevImage()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedImageIndex, galleryData])

    // Check for eventId in URL query params and auto-select event
    useEffect(() => {
        if (router.isReady && router.query.eventId && pastEvents.length > 0) {
            const eventId = router.query.eventId as string
            if (pastEvents.find(e => e.id === eventId)) {
                handleEventClick(eventId)
            }
        }
    }, [router.isReady, router.query.eventId, pastEvents.length])

    return (
        <>
            <SEO
                title="Events | Beats on the Beltline"
                description="Explore upcoming and past events from Beats on the Beltline. Join us for Atlanta's premier free outdoor electronic music experience."
                canonicalUrl="https://yourfestival.com/events"
            />

            <Header />

            <main className="pt-28 md:pt-[3.5rem]">
                {/* Hero + Upcoming Events Section Combined */}
                <section className="py-8 md:py-12 relative overflow-hidden hero-gradient-gold">
                    <div className="section-container relative z-10">
                        {/* Hero Title & Subtitle */}
                        <div className="text-center mb-12">
                            <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black mb-8 uppercase bg-gradient-to-r from-brand-pink via-brand-peach to-brand-primary bg-clip-text text-transparent">
                                Events
                            </h1>
                            <p className="text-2xl md:text-3xl text-brand-text font-bold max-w-4xl mx-auto">
                                Experience the rhythm of Atlanta
                            </p>
                        </div>

                        {/* Upcoming Events Content */}
                        <div>
                            <h2 className="font-title text-4xl md:text-6xl font-black text-center mb-4 text-brand-header uppercase">
                                Upcoming Events
                            </h2>

                            {loading ? (
                                <div className="flex justify-center items-center py-20">
                                    <Loader2 className="animate-spin text-brand-primary" size={48} />
                                    <span className="ml-4 text-xl text-brand-header">Loading events...</span>
                                </div>
                            ) : upcomingEvents.length === 0 ? (
                                <div className="max-w-3xl mx-auto text-center py-8">
                                    <div className="mb-6 text-brand-primary/40 flex justify-center">
                                        <Calendar size={80} strokeWidth={1.5} />
                                    </div>
                                    <p className="text-2xl text-brand-header/60 mb-8">
                                        New events coming soon!
                                    </p>
                                    <p className="text-lg text-brand-header/80 mb-8">
                                        Stay tuned for announcements about our next festival. Follow us on social media for the latest updates.
                                    </p>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="bg-brand-header text-white hover:bg-brand-primary hover:text-brand-header font-bold px-12 py-4 rounded-lg text-xl uppercase transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                                    >
                                        Join Our Mailing List
                                    </button>
                                </div>
                            ) : (
                                <div className="max-w-5xl mx-auto">
                                    <EventTabBar
                                        events={upcomingEvents}
                                        activeEventId={activeEventId}
                                        onSelect={setActiveEventId}
                                    />
                                    {/* Show the active event card */}
                                    {(() => {
                                        const active = upcomingEvents.find(e => e.id === activeEventId) ?? upcomingEvents[0]
                                        return active ? <UpcomingEventCard key={active.id} event={active} /> : null
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Past Events Section */}
                <section id="past-events" className="py-12 md:py-20 bg-brand-bg scroll-mt-20">
                    <div className="section-container">
                        <h2 className="font-title text-4xl md:text-6xl font-black text-center mb-16 text-brand-header uppercase">
                            Past Events
                        </h2>

                        {/* Loading State */}
                        {loading && (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="animate-spin text-brand-primary" size={48} />
                                <span className="ml-4 text-xl text-brand-header">Loading events...</span>
                            </div>
                        )}

                        {/* Error State */}
                        {error && !loading && (
                            <div className="max-w-2xl mx-auto text-center py-8">
                                <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-6">
                                    <AlertCircle className="mx-auto mb-4 text-yellow-600" size={48} />
                                    <p className="text-yellow-800 mb-4">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Events Grid */}
                        {!loading && (
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                                {pastEvents.map((event, index) => (
                                    <EventFlyerCard
                                        key={event.id}
                                        event={event}
                                        onClick={() => setSelectedFlyerIndex(index)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                </section>

                {/* Event Gallery Section - Dynamic from Cloudinary */}
                {selectedEvent && (
                    <section id="event-gallery" className="py-12 md:py-20 bg-brand-bg scroll-mt-20">
                        <div className="section-container">
                            <h2 className="font-title text-4xl md:text-6xl font-black text-center mb-4 gradient-text uppercase">
                                {pastEvents.find(e => e.id === selectedEvent)?.title} Gallery
                            </h2>
                            <p className="text-xl text-center text-brand-header/80 mb-16 max-w-3xl mx-auto">
                                Relive the moments from {formatEventDate(pastEvents.find(e => e.id === selectedEvent)?.date)}
                            </p>

                            {/* Gallery Loading State */}
                            {galleryLoading && (
                                <div className="flex justify-center items-center py-20">
                                    <Loader2 className="animate-spin text-brand-primary" size={48} />
                                    <span className="ml-4 text-xl text-brand-header">Loading gallery...</span>
                                </div>
                            )}

                            {/* Gallery Error State */}
                            {galleryError && !galleryLoading && (
                                <div className="max-w-2xl mx-auto text-center py-8 mb-8">
                                    <div className="bg-red-100 border-2 border-red-400 rounded-lg p-6">
                                        <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
                                        <p className="text-red-800 mb-4">{galleryError}</p>
                                        <button
                                            onClick={() => handleEventClick(selectedEvent)}
                                            className="btn-festival-outline"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Photos Grid */}
                            {galleryData && !galleryLoading && galleryData.photos.length > 0 && (
                                <div className="mb-12">
                                    <h3 className="text-2xl font-bold text-brand-header mb-6 text-center">
                                        Photos ({galleryData.photos.length})
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {galleryData.photos.map((photo, index) => (
                                            <div
                                                key={photo.id}
                                                className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer"
                                                onClick={() => openImageModal(index)}
                                            >
                                                <img
                                                    src={photo.thumbnailUrl}
                                                    alt={`${pastEvents.find(e => e.id === selectedEvent)?.title ?? ''} photo`}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-brand-header/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {galleryData && !galleryLoading && galleryData.photos.length === 0 && (
                                <div className="text-center py-12">
                                    <Music className="mx-auto mb-4 text-brand-primary/40" size={64} />
                                    <p className="text-xl text-brand-header/60">
                                        No photos or videos available for this event yet.
                                    </p>
                                    <p className="text-brand-header/40 mt-2">
                                        Check back soon!
                                    </p>
                                </div>
                            )}

                            {/* Close Gallery Button */}
                            <div className="text-center mt-12">
                                <button
                                    onClick={handleCloseGallery}
                                    className="btn-festival-outline btn-lg"
                                >
                                    Close Gallery
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* CTA Section */}
                <section className="py-12 md:py-20 bg-brand-bg">
                    <div className="section-container text-center">
                        <div className="mb-6 text-brand-primary flex justify-center">
                            <Music size={64} strokeWidth={1.5} />
                        </div>
                        <h2 className="font-title text-4xl md:text- font-black mb-6 text-brand-header uppercase">
                            Don't Miss Out
                        </h2>
                        <p className="text-xl text-brand-header font-bold mb-8 max-w-2xl mx-auto">
                            Be the first to know about upcoming events, artist lineups, and exclusive updates.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn-festival btn-lg text-xl px-12 uppercase"
                        >
                            Get Connected
                        </button>
                    </div>
                </section>
            </main>

            {/* Connect Modal */}
            <ConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            {/* Image Modal */}
            {selectedImageIndex !== null && galleryData && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
                    onClick={closeImageModal}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeImageModal}
                        className="absolute top-4 right-4 z-[110] text-white hover:text-brand-primary transition-colors bg-black/50 rounded-full p-3 hover:bg-black/70"
                        aria-label="Close modal"
                    >
                        <X size={32} />
                    </button>

                    {/* Previous Button */}
                    {galleryData.photos.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                prevImage()
                            }}
                            className="absolute left-4 z-[110] text-white hover:text-brand-primary transition-colors bg-black/50 rounded-full p-3 hover:bg-black/70"
                            aria-label="Previous image"
                        >
                            <ChevronLeft size={32} />
                        </button>
                    )}

                    {/* Image Container */}
                    <div
                        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={galleryData.photos[selectedImageIndex].url}
                            alt={`${pastEvents.find(e => e.id === selectedEvent)?.title ?? ''} photo ${selectedImageIndex + 1}`}
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />

                        {/* Image Counter */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                            {selectedImageIndex + 1} / {galleryData.photos.length}
                        </div>
                    </div>

                    {/* Next Button */}
                    {galleryData.photos.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                nextImage()
                            }}
                            className="absolute right-4 z-[110] text-white hover:text-brand-primary transition-colors bg-black/50 rounded-full p-3 hover:bg-black/70"
                            aria-label="Next image"
                        >
                            <ChevronRight size={32} />
                        </button>
                    )}
                </div>
            )}

            <Footer />

            <FlyerModal
                events={pastEvents}
                selectedIndex={selectedFlyerIndex}
                onClose={() => setSelectedFlyerIndex(null)}
                onPrev={() => setSelectedFlyerIndex(i => i !== null ? (i - 1 + pastEvents.length) % pastEvents.length : null)}
                onNext={() => setSelectedFlyerIndex(i => i !== null ? (i + 1) % pastEvents.length : null)}
            />
        </>
    )
}
