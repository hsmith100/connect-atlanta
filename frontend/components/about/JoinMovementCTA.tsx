import { useState } from 'react'
import ConnectModal from '../shared/ConnectModal'

export default function JoinMovementCTA() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
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
        <button onClick={() => setIsModalOpen(true)} className="btn-festival btn-lg text-xl px-12 uppercase">
          CONNECT WITH US
        </button>
      </div>
      <ConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  )
}
