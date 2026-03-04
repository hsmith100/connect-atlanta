import Image from 'next/image'
import { Maximize2 } from 'lucide-react'
import type { Event } from '@shared/types/events'

interface EventFlyerCardProps {
    event: Event
    onClick?: () => void
}

export default function EventFlyerCard({ event, onClick }: EventFlyerCardProps) {
    return (
        <div
            className={`card-bg-white shadow-xl border-2 border-brand-primary/10 rounded-2xl overflow-hidden${onClick ? ' cursor-pointer hover:border-brand-primary hover:shadow-2xl transition-all group' : ''}`}
            onClick={onClick}
        >
            <figure className="relative aspect-auto w-full">
                <Image
                    src={event.flyerUrl ?? ''}
                    alt={event.title}
                    width={1080}
                    height={1350}
                    className="object-contain w-full h-full"
                />
                {onClick && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Maximize2
                            size={36}
                            className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                        />
                    </div>
                )}
            </figure>
        </div>
    )
}
