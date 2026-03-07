const SPONSORS = [
  { name: 'Coke Zero', logo: '/images/sponsors/coke-zero.svg' },
  { name: 'Deep Eddy', logo: '/images/sponsors/deep-eddy.svg' },
  { name: 'Lunazul', logo: '/images/sponsors/lunazul.svg' },
  { name: 'EVDY', logo: '/images/sponsors/evdy.svg' },
  { name: 'Simply Pop', logo: '/images/sponsors/simply-pop.svg' },
  { name: 'Nine Dot', logo: '/images/sponsors/nine-dot.svg' },
  { name: 'Amiqo', logo: '/images/sponsors/amiqo.svg' },
  { name: '4Ever Young', logo: '/images/sponsors/4ever-young.svg' },
  { name: 'Sub Riot', logo: '/images/sponsors/sub-riot.svg' },
]

const SMALLER_HEIGHT = new Set(['Simply Pop', 'Amiqo', '4Ever Young'])
const LARGER_HEIGHT = new Set(['Sub Riot'])

export default function SponsorsSection() {
  return (
    <section className="py-6 md:py-10 hero-bg-gold">
      <div className="section-container">
        <h2 className="font-title text-3xl md:text-4xl font-black text-center mb-6 text-brand-header uppercase">
          Sponsors
        </h2>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 items-center max-w-3xl mx-auto">
          {SPONSORS.map((sponsor, idx) => {
            const heightClass = SMALLER_HEIGHT.has(sponsor.name) ? 'max-h-[35px]' : LARGER_HEIGHT.has(sponsor.name) ? 'max-h-[65px]' : 'max-h-[50px]'
            const widthClass = LARGER_HEIGHT.has(sponsor.name) ? 'max-w-[80px]' : 'max-w-[60px]'
            return (
              <div key={idx} className="flex items-center justify-center hover:scale-110 transition-transform cursor-pointer p-1">
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  width="100"
                  height="80"
                  className={`object-contain ${widthClass} ${heightClass} h-auto opacity-100 transition-opacity`}
                  loading="lazy"
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
