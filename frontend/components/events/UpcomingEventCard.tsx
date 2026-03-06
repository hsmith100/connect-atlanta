import Image from 'next/image'
import { Calendar, Clock, MapPin } from 'lucide-react'
import type { Event } from '@shared/types/events'
import { formatEventDate, formatTime } from '../../lib/formatters'

interface UpcomingEventCardProps {
    event: Event
}

export default function UpcomingEventCard({ event }: UpcomingEventCardProps) {
    return (
        <div className="bg-white/80 backdrop-blur-sm border-2 border-brand-primary/30 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2 gap-0">
                {/* Event Flyer */}
                <div className="relative bg-brand-bg-cream flex items-center justify-center p-8">
                    {event.flyerUrl ? (
                        <Image
                            src={event.flyerUrl}
                            alt={event.title}
                            width={1080}
                            height={1350}
                            className="w-full h-auto rounded-2xl shadow-xl"
                            priority
                        />
                    ) : (
                        <div className="w-full aspect-[4/5] rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                            <Calendar size={80} className="text-brand-primary/30" strokeWidth={1.5} />
                        </div>
                    )}
                </div>

                {/* Event Details */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                    <h3 className="font-festival text-4xl md:text-5xl font-black text-brand-header mb-6 uppercase">
                        {event.title}
                    </h3>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-4 text-brand-text">
                            <Calendar size={28} className="text-brand-primary mt-1 flex-shrink-0" strokeWidth={2} />
                            <p className="text-2xl font-bold text-brand-header">{formatEventDate(event.date)}</p>
                        </div>

                        {event.startTime && (
                            <div className="flex items-start gap-4 text-brand-text">
                                <Clock size={28} className="text-brand-primary mt-1 flex-shrink-0" strokeWidth={2} />
                                <p className="text-2xl font-bold text-brand-header">
                                    {event.endTime
                                        ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
                                        : formatTime(event.startTime)}
                                </p>
                            </div>
                        )}

                        {event.location && (
                            <div className="flex items-start gap-4 text-brand-text">
                                <MapPin size={28} className="text-brand-primary mt-1 flex-shrink-0" strokeWidth={2} />
                                <p className="text-2xl font-bold text-brand-header">{event.location}</p>
                            </div>
                        )}
                    </div>

                    {event.description && (
                        <p className="text-xl text-brand-text mb-8 leading-relaxed">{event.description}</p>
                    )}

                    {event.ticketingUrl && (
                        <a
                            href={event.ticketingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-festival text-xl py-4 transform hover:scale-105 transition-all block text-center"
                        >
                            {event.buttonText || 'Get Info & Updates'}
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}
