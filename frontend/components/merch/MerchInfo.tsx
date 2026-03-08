const PILLARS = [
  {
    label: 'Quality Materials',
    description: 'Premium fabrics and prints that last',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7h-9"></path><path d="M14 17H5"></path>
        <circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle>
      </svg>
    ),
  },
  {
    label: 'Fast Shipping',
    description: 'Get your gear delivered quickly',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    ),
  },
  {
    label: 'Support the Scene',
    description: 'Your purchase supports local music',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    ),
  },
]

export default function MerchInfo() {
  return (
    <section className="py-12 md:py-20 bg-brand-bg">
      <div className="section-container max-w-4xl">
        <h2 className="font-title text-4xl md:text-6xl font-black text-center mb-12 text-brand-header uppercase">
          Why Shop With Us?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PILLARS.map(({ label, description, icon }) => (
            <div key={label} className="text-center">
              <div className="mb-4 text-brand-primary flex justify-center">{icon}</div>
              <h3 className="text-xl font-bold text-brand-header mb-2">{label}</h3>
              <p className="text-brand-header/70">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
