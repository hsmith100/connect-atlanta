import { useEffect } from 'react'
import MerchGrid from '../merch/MerchGrid'
import MerchInfo from '../merch/MerchInfo'
import EventPhotosSection from './EventPhotosSection'

// The Shop: merch (bought on Bonfire) and event photos (bought on this site).
export default function ShopPage() {
  // Static export: scroll to #photos ourselves once the section exists (e.g. from the Gallery link).
  useEffect(() => {
    if (window.location.hash === '#photos') document.getElementById('photos')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <>
      <section className="py-8 md:py-12 relative overflow-hidden hero-gradient-gold">
        <div className="section-container relative z-10">
          <div className="text-center mb-12">
            <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black mb-8 uppercase text-brand-pink">
              Shop
            </h1>
          </div>
          <h2 className="font-title text-4xl md:text-6xl font-black text-center mb-3 text-brand-header uppercase">Merch</h2>
          <p className="text-center text-brand-text/80 mb-10">Official festival gear. Checkout on our merch store.</p>
          <MerchGrid />
        </div>
      </section>

      <MerchInfo />

      <EventPhotosSection />
    </>
  )
}
