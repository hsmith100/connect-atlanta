const SPONSORS_2026 = [
  { name: 'Sponsor 3',  logo: '/images/Sponsor%20Logos%202026/3.png'  },
  { name: 'Sponsor 4',  logo: '/images/Sponsor%20Logos%202026/4.png'  },
  { name: 'Sponsor 5',  logo: '/images/Sponsor%20Logos%202026/5.png'  },
  { name: 'Sponsor 6',  logo: '/images/Sponsor%20Logos%202026/6.png'  },
  { name: 'Sponsor 7',  logo: '/images/Sponsor%20Logos%202026/7.png'  },
  { name: 'Sponsor 8',  logo: '/images/Sponsor%20Logos%202026/8.png'  },
  { name: 'Sponsor 9',  logo: '/images/Sponsor%20Logos%202026/9.png'  },
  { name: 'Sponsor 10', logo: '/images/Sponsor%20Logos%202026/10.png' },
  { name: 'Sponsor 11', logo: '/images/Sponsor%20Logos%202026/11.png' },
  { name: 'Sponsor 12', logo: '/images/Sponsor%20Logos%202026/12.png' },
  { name: 'Sponsor 13', logo: '/images/Sponsor%20Logos%202026/13.png' },
  { name: 'Sponsor 14', logo: '/images/Sponsor%20Logos%202026/14.png' },
  { name: 'Sponsor 15', logo: '/images/Sponsor%20Logos%202026/15.png' },
]

export default function SponsorsSection() {
  return (
    <section className="py-6 md:py-10 hero-bg-gold">
      <div className="section-container">
        <h2 className="font-title text-3xl md:text-4xl font-black text-center mb-6 text-brand-header uppercase">
          Sponsors
        </h2>

        {/* Presenting sponsor — featured above the grid */}
        <div className="flex justify-center mb-8">
          <img
            src="/images/Sponsor%20Logos%202026/2.png"
            alt="Advanced Health Solutions — Presenting Sponsor"
            className="max-w-[140px] md:max-w-[160px] h-auto"
          />
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 items-center max-w-3xl mx-auto">
          {SPONSORS_2026.map((sponsor, idx) => (
            <div key={idx} className="flex items-center justify-center hover:scale-110 transition-transform cursor-pointer p-1">
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                width="100"
                height="80"
                className="object-contain max-w-[60px] max-h-[50px] h-auto opacity-100 transition-opacity"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
