import { useState } from 'react'
import SEO from '../components/shared/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import SponsorDeckSlider from '../components/sponsor/SponsorDeckSlider'
import SponsorDeckModal from '../components/sponsor/SponsorDeckModal'
import SponsorInquiryForm from '../components/shared/SponsorInquiryForm'

const SPONSOR_DECK_IMAGES = Array.from({ length: 14 }, (_, i) => `/images/sponsors/sponsor_deck/${i + 1}.webp`)

export default function SponsorInquiries() {
  const [modalIndex, setModalIndex] = useState<number | null>(null)

  return (
    <>
      <SEO
        title="Sponsor Inquiries | Beats on the Beltline"
        description="Interested in sponsoring Beats on the Beltline 2026? Partner with Atlanta's premier free outdoor electronic music festival reaching 5,000-10,000 attendees."
        canonicalUrl="https://connectevents.co/sponsor-inquiries"
      />

      <Header />

      <main className="pt-28 md:pt-[3.5rem]">
        <section className="relative overflow-hidden hero-gradient-gold">
          <div className="pt-6 pb-2">
            <div className="section-container relative z-10">
              <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black text-center mb-3 uppercase bg-gradient-to-r from-brand-pink via-brand-peach to-brand-primary bg-clip-text text-transparent">
                Sponsor Inquiries
              </h1>
              <p className="text-xl md:text-2xl text-center text-brand-text max-w-4xl mx-auto mb-3">
                Partner with us to reach 5,000-10,000 engaged attendees through flexible, impactful sponsorship opportunities at Atlanta's premier free music festival.
              </p>
              <p className="text-center text-brand-text/80 text-sm mb-2">
                Click any image to view the full deck
              </p>
            </div>
          </div>

          <SponsorDeckSlider images={SPONSOR_DECK_IMAGES} onOpenModal={setModalIndex} />
        </section>

        <SponsorInquiryForm />
      </main>

      {modalIndex !== null && (
        <SponsorDeckModal
          images={SPONSOR_DECK_IMAGES}
          initialIndex={modalIndex}
          onClose={() => setModalIndex(null)}
        />
      )}

      <Footer />
    </>
  )
}
