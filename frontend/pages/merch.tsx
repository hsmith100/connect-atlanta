import SEO from '../components/shared/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import MerchGrid from '../components/merch/MerchGrid'
import MerchInfo from '../components/merch/MerchInfo'

export default function Merch() {
  return (
    <>
      <SEO
        title="Merch | Beats on the Beltline"
        description="Shop official Beats on the Beltline merchandise. Festival apparel, accessories, and more."
        canonicalUrl="https://yourfestival.com/merch"
      />

      <Header />

      <main className="pt-28 md:pt-[3.5rem]">
        <section className="py-8 md:py-12 relative overflow-hidden hero-gradient-gold">
          <div className="section-container relative z-10">
            <div className="text-center mb-12">
              <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black mb-8 uppercase bg-gradient-to-r from-brand-pink via-brand-peach to-brand-primary bg-clip-text text-transparent">
                Merch
              </h1>
              <p className="text-2xl md:text-3xl text-brand-text font-bold max-w-4xl mx-auto">
                Rep the festival with official gear
              </p>
            </div>
            <MerchGrid />
          </div>
        </section>

        <MerchInfo />
      </main>

      <Footer />
    </>
  )
}
