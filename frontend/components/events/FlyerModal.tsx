import { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Event } from '@shared/types/events'

interface FlyerModalProps {
    events: Event[]
    selectedIndex: number | null
    onClose: () => void
    onPrev: () => void
    onNext: () => void
}

export default function FlyerModal({ events, selectedIndex, onClose, onPrev, onNext }: FlyerModalProps) {
    useEffect(() => {
        if (selectedIndex !== null) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [selectedIndex])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex === null) return
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowRight') onNext()
            if (e.key === 'ArrowLeft') onPrev()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedIndex, onClose, onNext, onPrev])

    if (selectedIndex === null) return null

    const event = events[selectedIndex]

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-[110] text-white hover:text-brand-primary transition-colors bg-black/50 rounded-full p-3 hover:bg-black/70"
                aria-label="Close"
            >
                <X size={32} />
            </button>

            {/* Previous Button */}
            {events.length > 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev() }}
                    className="absolute left-4 z-[110] text-white hover:text-brand-primary transition-colors bg-black/50 rounded-full p-3 hover:bg-black/70"
                    aria-label="Previous flyer"
                >
                    <ChevronLeft size={32} />
                </button>
            )}

            {/* Image */}
            <div
                className="relative max-w-2xl max-h-[90vh] w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={event.flyerUrl ?? ''}
                    alt={event.title}
                    className="max-w-full max-h-full object-contain rounded-lg"
                />
                {events.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                        {selectedIndex + 1} / {events.length}
                    </div>
                )}
            </div>

            {/* Next Button */}
            {events.length > 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext() }}
                    className="absolute right-4 z-[110] text-white hover:text-brand-primary transition-colors bg-black/50 rounded-full p-3 hover:bg-black/70"
                    aria-label="Next flyer"
                >
                    <ChevronRight size={32} />
                </button>
            )}
        </div>
    )
}
