import { Music, Heart, Users } from 'lucide-react'

const PILLARS = [
  {
    icon: Music,
    title: 'Festival-Grade Music',
    items: [
      '12-20 DJs per event',
      'Multiple electronic subgenres',
      'Emerging & established artists',
      'Visual and lighting production',
    ],
  },
  {
    icon: Users,
    title: 'Community Focus',
    items: [
      '30+ local vendors',
      'Food & beverage partners',
      'Creative businesses',
      'Live art',
      'Nonprofit collaborations and fundraising',
      'Free & accessible to all',
      'All-ages welcome',
    ],
  },
  {
    icon: Heart,
    title: 'The Experience',
    items: [
      '5,000–10,000 attendees',
      'Daytime outdoor festival',
      'Atlanta Beltline setting',
      'Immersive stage design',
      'Public art celebration',
      'After parties',
      'Unforgettable memories',
    ],
  },
]

export default function WhatWeBring() {
  return (
    <section className="py-12 md:py-20 bg-brand-bg">
      <div className="section-container">
        <h2 className="font-title text-4xl md:text-6xl font-black text-center mb-16 text-brand-header uppercase">
          What We Bring
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PILLARS.map(({ icon: Icon, title, items }) => (
            <div key={title} className="card-bg-white border-2 border-brand-primary/20 p-8 rounded-2xl shadow-md hover:border-brand-primary transition-all hover:shadow-lg">
              <div className="mb-4 text-brand-primary">
                <Icon size={40} strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl font-bold text-brand-header mb-3">{title}</h3>
              <ul className="space-y-2 text-brand-header">
                {items.map(item => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
