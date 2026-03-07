import Link from 'next/link'
import type { HeroCard } from '@shared/types/heroCards'
import { HeroCardVisual } from '../HeroCardVisual'

interface HeroSectionProps {
  heroCards: HeroCard[]
}

export default function HeroSection({ heroCards }: HeroSectionProps) {
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

        {/* Hero Cards Grid - Admin-managed */}
        <div className="flex flex-col md:flex-row md:justify-center md:flex-wrap gap-4 max-w-7xl mx-auto">
          {heroCards.map((card) =>
            card.linkUrl.startsWith('http') ? (
              <a key={card.id} href={card.linkUrl} target="_blank" rel="noopener noreferrer" className="block h-full md:w-72">
                <HeroCardVisual card={card} />
              </a>
            ) : (
              <Link key={card.id} href={card.linkUrl} className="block h-full md:w-72">
                <HeroCardVisual card={card} />
              </Link>
            )
          )}
        </div>
      </div>
    </section>
  )
}
