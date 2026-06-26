const SPONSORS_2026 = [
  { name: 'Sponsor 6', logo: '/images/sponsors/logos/4_ever_young.svg' },
  { name: 'Sponsor 7', logo: '/images/sponsors/logos/babey_drew_foundation.svg' },
  { name: 'Sponsor 8', logo: '/images/sponsors/logos/bang.svg' },
  { name: 'Sponsor 9', logo: '/images/sponsors/logos/bebop.svg' },
  { name: 'Sponsor 10', logo: '/images/sponsors/logos/coca_cola.svg' },
  { name: 'Sponsor 11', logo: '/images/sponsors/logos/deep_eddy.svg' },
  { name: 'Sponsor 12', logo: '/images/sponsors/logos/evdy.svg' },
  { name: 'Sponsor 13', logo: '/images/sponsors/logos/lunazul.svg' },
  { name: 'Sponsor 14', logo: '/images/sponsors/logos/marta.svg' },
  { name: 'Sponsor 15', logo: '/images/sponsors/logos/nine_dot.svg' },
  { name: 'Sponsor 16', logo: '/images/sponsors/logos/pibb.svg' },
  { name: 'Sponsor 17', logo: '/images/sponsors/logos/smart_water.svg' },
  { name: 'Sponsor 18', logo: '/images/sponsors/logos/sound_system.svg' },
  { name: 'Sponsor 19', logo: '/images/sponsors/logos/surfside.svg' },
  { name: 'Sponsor 19', logo: '/images/sponsors/logos/topo_chico.svg' },
]

export default function SponsorsSection() {
  return (
    <section className="py-6 md:py-10 hero-bg-gold">
      <div className="section-container">
        <h2 className="font-title text-5xl md:text-7xl font-black text-center mb-6 text-brand-header uppercase">
          Sponsors
        </h2>

        {/* Presenting sponsor — featured above the grid */}
        <div className="flex justify-center mb-8">
          <img
            src="/images/sponsors/logos/ahs.svg"
            alt="Advanced Health Solutions — Presenting Sponsor"
            className="w-full max-w-[500px] h-auto"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-center max-w-5xl mx-auto">
          {SPONSORS_2026.map((sponsor, idx) => (
            <div key={idx} className="flex items-center justify-center hover:scale-110 transition-transform cursor-pointer p-1">
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                width="100"
                height="80"
                className="object-contain w-full max-h-[70px] md:max-h-[140px] h-auto opacity-100 transition-opacity"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
