import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import SEO from '../components/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ConnectModal from '../components/ConnectModal'
import Image from 'next/image'
import { Calendar, Clock, MapPin, Music, Loader2, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getEvents, getEventGallery } from '../lib/api'
import type { Event } from '@shared/types/events'

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
}

interface GalleryPhoto {
  id: string;
  url: string;
  thumbnail: string;
}

interface GalleryVideo {
  id: string;
  url: string;
  thumbnail: string;
}

interface EventGalleryData {
  eventTitle: string;
  photoCount: number;
  videoCount: number;
  photos: GalleryPhoto[];
  videos: GalleryVideo[];
}

// Format date to "Month Day(th), Year"
const formatEventDate = (dateString: string | undefined): string => {
    if (!dateString) return ''

    const date = new Date(dateString)
    const month = date.toLocaleDateString('en-US', { month: 'long' })
    const day = date.getDate()
    const year = date.getFullYear()

    // Add ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (d: number): string => {
        if (d > 3 && d < 21) return 'th'
        switch (d % 10) {
            case 1: return 'st'
            case 2: return 'nd'
            case 3: return 'rd'
            default: return 'th'
        }
    }

    return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`
}

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

    // Event data from backend
    const [upcomingEvents] = useState<UpcomingEvent[]>([
        {
            id: 'april-2026',
            title: "Beats on the Beltline",
            date: "April 25, 2026",
            time: "2:00 PM - 10:00 PM",
            location: "Atlanta Beltline",
            image: "/images/events/april-2026.webp"
        }
    ])
    const [pastEvents, setPastEvents] = useState<Event[]>([])

    // Load events on mount
    useEffect(() => {
        async function loadEvents() {
            try {
                const events = await getEvents()
                setPastEvents(events)
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
            setGalleryData(gallery as EventGalleryData)
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

                            {upcomingEvents.length === 0 ? (
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
                                    {upcomingEvents.map((event) => (
                                        <div key={event.id} className="bg-white/80 backdrop-blur-sm border-2 border-brand-primary/30 rounded-3xl overflow-hidden shadow-2xl">
                                            <div className="grid md:grid-cols-2 gap-0">
                                                {/* Event Flyer */}
                                                <div className="relative bg-brand-bg-cream flex items-center justify-center p-8">
                                                    <Image
                                                        src={event.image}
                                                        alt={event.title}
                                                        width={1080}
                                                        height={1350}
                                                        className="w-full h-auto rounded-2xl shadow-xl"
                                                        priority
                                                    />
                                                </div>

                                                {/* Event Details */}
                                                <div className="p-8 md:p-12 flex flex-col justify-center">
                                                    <h3 className="font-festival text-4xl md:text-5xl font-black text-brand-header mb-6 uppercase">
                                                        {event.title}
                                                    </h3>

                                                    <div className="space-y-4 mb-8">
                                                        <div className="flex items-start gap-4 text-brand-text">
                                                            <Calendar size={28} className="text-brand-primary mt-1 flex-shrink-0" strokeWidth={2} />
                                                            <div>
                                                                <p className="text-2xl font-bold text-brand-header">{event.date}</p>
                                                                <p className="text-lg text-brand-text/80">Mark your calendar!</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-4 text-brand-text">
                                                            <Clock size={28} className="text-brand-primary mt-1 flex-shrink-0" strokeWidth={2} />
                                                            <div>
                                                                <p className="text-2xl font-bold text-brand-header">{event.time}</p>
                                                                <p className="text-lg text-brand-text/80">All afternoon & evening</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-4 text-brand-text">
                                                            <MapPin size={28} className="text-brand-primary mt-1 flex-shrink-0" strokeWidth={2} />
                                                            <div>
                                                                <p className="text-2xl font-bold text-brand-header">{event.location}</p>
                                                                <p className="text-lg text-brand-text/80">Atlanta's premier trail</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <p className="text-xl text-brand-text mb-8 leading-relaxed">
                                                        Join us for an unforgettable day of music, art, and community along Atlanta's iconic Beltline. Free admission, world-class DJs, and amazing vibes!
                                                    </p>

                                                    <a
                                                        href="https://bit.ly/botbapril"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-festival text-xl py-4 transform hover:scale-105 transition-all block text-center"
                                                    >
                                                        Get Info & Updates
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {pastEvents.map((event) => (
                                    <div key={event.id} className="card-bg-white shadow-xl border-2 border-brand-primary/10 rounded-2xl overflow-hidden">
                                        <figure className="relative aspect-auto w-full">
                                            <Image
                                                src={event.flyerUrl ?? ''}
                                                alt={event.title}
                                                width={1080}
                                                height={1350}
                                                className="object-contain w-full h-full"
                                            />
                                        </figure>
                                    </div>
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
                                {galleryData?.eventTitle || pastEvents.find(e => e.id === selectedEvent)?.title} Gallery
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
                                        Photos ({galleryData.photoCount})
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {galleryData.photos.map((photo, index) => (
                                            <div
                                                key={photo.id}
                                                className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer"
                                                onClick={() => openImageModal(index)}
                                            >
                                                <img
                                                    src={photo.thumbnail}
                                                    alt={`${galleryData.eventTitle} photo`}
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

                            {/* Videos Grid */}
                            {galleryData && !galleryLoading && galleryData.videos.length > 0 && (
                                <div className="mb-12">
                                    <h3 className="text-2xl font-bold text-brand-header mb-6 text-center">
                                        Videos ({galleryData.videoCount})
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {galleryData.videos.map((video) => (
                                            <div key={video.id} className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                                                <video
                                                    src={video.url}
                                                    poster={video.thumbnail}
                                                    controls
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {galleryData && !galleryLoading && galleryData.photos.length === 0 && galleryData.videos.length === 0 && (
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
                            alt={`${galleryData.eventTitle} photo ${selectedImageIndex + 1}`}
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
        </>
    )
}
