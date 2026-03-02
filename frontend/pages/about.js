import { useState } from 'react'
import SEO from '../components/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ConnectModal from '../components/ConnectModal'
import Image from 'next/image'
import { Music, Heart, Target, Sparkles, Users, MapPin } from 'lucide-react'

export default function About() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <SEO
        title="About Us | Beats on the Beltline"
        description="Learn about Atlanta's premier free outdoor electronic music experience. Discover our mission, vision, and the story behind Beats on the Beltline."
        canonical="https://yourfestival.com/about"
      />

      <Header />

      <main className="pt-28 md:pt-[3.5rem]">
        {/* Hero + Main Story Section Combined */}
        <section className="py-8 md:py-12 relative overflow-hidden hero-gradient-gold">
          <div className="section-container relative z-10">
            {/* Hero Title & Subtitle */}
            <div className="text-center mb-12">
              <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black mb-8 uppercase bg-gradient-to-r from-brand-pink via-brand-peach to-brand-primary bg-clip-text text-transparent">
                About Us
              </h1>
              <p className="text-2xl md:text-3xl text-brand-text font-bold max-w-4xl mx-auto">
                Atlanta's premier free outdoor electronic music experience
              </p>
            </div>

            {/* Main Story Content */}
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-brand-header leading-relaxed mb-6">
                  Beats on the Beltline is Atlanta's premier free one day music festival, bringing together thousands of people to celebrate community, culture, and creativity.
                </p>

                <p className="text-xl text-brand-header leading-relaxed mb-6">
                  Set along the iconic Beltline, the southeast's heaviest foot traffic area, the event features high energy DJ performances across multiple stages, a curated lineup of local food vendors, bars, and interactive brand activations that create an unforgettable experience.
                </p>

                <p className="text-xl text-brand-header leading-relaxed">
                  Beyond the music, Beats on the Beltline is a platform for local businesses, artists, and creators to connect with a vibrant and growing audience. Approaching 10,000 attendees per event, CONNECT events provide a space that amplifies talent and gives brands a powerful way to show up in the heart of Atlanta.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* What We Bring */}
        <section className="py-12 md:py-20 bg-brand-bg">
          <div className="section-container">
            <h2 className="font-title text-4xl md:text-6xl font-black text-center mb-16 text-brand-header uppercase">
              What We Bring
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Music */}
              <div className="card-bg-white border-2 border-brand-primary/20 p-8 rounded-2xl shadow-md hover:border-brand-primary transition-all hover:shadow-lg">
                <div className="mb-4 text-brand-primary">
                  <Music size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-brand-header mb-3">Festival-Grade Music</h3>
                <ul className="space-y-2 text-brand-header">
                  <li>• 12-20 DJs per event</li>
                  <li>• Multiple electronic subgenres</li>
                  <li>• Emerging & established artists</li>
                  <li>• Visual and lighting production</li>
                </ul>
              </div>

              {/* Community */}
              <div className="card-bg-white border-2 border-brand-primary/20 p-8 rounded-2xl shadow-md hover:border-brand-primary transition-all hover:shadow-lg">
                <div className="mb-4 text-brand-primary">
                  <Users size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-brand-header mb-3">Community Focus</h3>
                <ul className="space-y-2 text-brand-header">
                  <li>• 30+ local vendors</li>
                  <li>• Food & beverage partners</li>
                  <li>• Creative businesses</li>
                  <li>• Live art</li>
                  <li>• Nonprofit collaborations and fundraising</li>
                  <li>• Free & accessible to all</li>
                  <li>• All-ages welcome</li>
                </ul>
              </div>

              {/* Experience */}
              <div className="card-bg-white border-2 border-brand-primary/20 p-8 rounded-2xl shadow-md hover:border-brand-primary transition-all hover:shadow-lg">
                <div className="mb-4 text-brand-primary">
                  <Heart size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-brand-header mb-3">The Experience</h3>
                <ul className="space-y-2 text-brand-header">
                  <li>• 5,000–10,000 attendees</li>
                  <li>• Daytime outdoor festival</li>
                  <li>• Atlanta Beltline setting</li>
                  <li>• Immersive stage design</li>
                  <li>• Public art celebration</li>
                  <li>• After parties</li>
                  <li>• Unforgettable memories</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Connect CTA Section */}
        <section className="py-12 md:py-20 bg-brand-bg">
          <div className="section-container text-center">
            <h2 className="font-title text-5xl md:text-7xl font-black mb-8 text-brand-header uppercase">
              Join the Movement
            </h2>

            <div className="max-w-3xl mx-auto space-y-6 mb-12">
              <p className="text-xl leading-relaxed text-brand-text font-bold">
                Want to be part of Atlanta's most vibrant music community? Stay connected with us for event updates, artist lineups, exclusive content, and giveaways.
              </p>
              <p className="text-lg leading-relaxed text-brand-text">
                Whether you're an artist, vendor, sponsor, or music lover - there's a place for you at Beats on the Beltline.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-festival btn-lg text-xl px-12 uppercase"
            >
              CONNECT WITH US
            </button>
          </div>
        </section>
      </main>

      {/* Connect Modal */}
      <ConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <Footer />
    </>
  )
}

