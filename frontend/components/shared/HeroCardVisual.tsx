import { Pencil, Trash2, Loader2, ImageIcon, Headphones, Users, Camera, Music, Star, Mic, Heart, Zap } from 'lucide-react'
import type { HeroCard } from '@shared/types/heroCards'

export const HERO_ICON_MAP: Record<string, React.ElementType> = {
  Headphones, Users, Camera, Music, Star, Mic, Heart, Zap,
}

interface HeroCardVisualProps {
  card: HeroCard
  // When provided, renders in admin mode: edit/delete overlay, hidden badge, no hover effects
  onEdit?: () => void
  onDelete?: () => void
  deleting?: boolean
}

export function HeroCardVisual({ card, onEdit, onDelete, deleting }: HeroCardVisualProps) {
  const IconComponent = card.icon ? HERO_ICON_MAP[card.icon] : null
  const admin = !!(onEdit || onDelete)

  return (
    <div className={[
      'relative border-2 rounded-2xl overflow-hidden shadow-lg transition-all group h-full',
      card.visible ? 'border-brand-primary/20' : 'border-gray-700 opacity-60',
      !admin && card.visible ? 'hover:border-brand-primary hover:shadow-2xl' : '',
    ].join(' ')}>
      <div className={`relative overflow-hidden ${admin ? 'aspect-[3/4]' : 'aspect-[4/3] md:aspect-[3/4]'}`}>
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.title}
            className={`absolute inset-0 w-full h-full object-cover${!admin ? ' group-hover:scale-105 transition-transform duration-500' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            {admin && <ImageIcon size={40} className="text-gray-600" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />

        {/* Admin overlays */}
        {admin && (
          <>
            {!card.visible && (
              <div className="absolute top-3 left-3 z-10">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900/80 text-gray-300">Hidden</span>
              </div>
            )}
            <div className="absolute top-3 right-3 flex gap-1 z-10">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded-lg bg-black/60 text-white hover:text-brand-primary hover:bg-black/80 transition-colors"
                  title="Edit card"
                >
                  <Pencil size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  disabled={deleting}
                  className="p-1.5 rounded-lg bg-black/60 text-white hover:text-red-400 hover:bg-black/80 transition-colors disabled:opacity-50"
                  title="Delete card"
                >
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              )}
            </div>
          </>
        )}

        {/* Card content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          {IconComponent && (
            <div className="mb-3">
              <IconComponent size={36} className="text-white mb-2" strokeWidth={1.5} />
            </div>
          )}
          <h2 className={`font-title font-black text-white mb-3 uppercase hero-card-title ${admin ? 'text-xl' : 'text-xl md:text-2xl animate-slide-down animate-delay-100 md:min-h-[3.5rem]'}`}>
            {card.title}
          </h2>
          <p className={`text-white/90 mb-4 text-sm leading-relaxed${!admin ? ' md:min-h-[3rem]' : ''}`}>
            {card.description}
          </p>
          <div className="btn-festival w-full relative z-10 text-center pointer-events-none">
            {card.ctaText}
          </div>
        </div>
      </div>
    </div>
  )
}
