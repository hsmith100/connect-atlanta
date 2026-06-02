import SEO from '../components/shared/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function SecretLineup() {
  return (
    <>
      <SEO
        title="Secret Lineup | Beats on the Block"
        description="The official Beats on the Block lineup, presented by Advanced Health Solutions."
        noindex={true}
      />

      <Header />

      <main className="pt-28 md:pt-[3.5rem]">
        <section className="py-8 md:py-12 relative overflow-hidden hero-gradient-gold">
          <div className="section-container relative z-10">

            {/* Title */}
            <div className="text-center mb-4">
              <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black mb-4 uppercase text-brand-pink">
                Secret Lineup
              </h1>
            </div>

            {/* AHS Sponsor Section */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="text-center">
                <img
                  src="/images/Sponsor Logos 2026/2.png"
                  alt="Presented by Advanced Health Solutions"
                  className="mx-auto max-w-[200px] md:max-w-xs my-6"
                />
              </div>

              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-brand-header leading-relaxed mb-6">
                  At Beats on the Block, we are all about creating free spaces where our community can dance, connect, and thrive together. To take that community first mission to the next level, we're thrilled to partner with Advanced Health Solutions!
                </p>
                <p className="text-xl text-brand-header leading-relaxed mb-6">
                  AHS is a premier personal injury and wellness practice dedicated to keeping you moving stress free. If life ever throws an accident your way, their patient first model provides complete medical and legal care with zero out of pocket costs. You pay nothing unless you win your case! Together, we've got your back, on and off the dance floor.
                </p>
                <p className="text-xl text-brand-header leading-relaxed mb-8">
                  Check them out! They are pretty cool if you ask us.
                </p>
              </div>

              <div className="text-center mb-16">
                <a
                  href="https://ahsdoctors.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-brand-pink to-brand-primary text-white font-bold py-3 px-8 rounded-full text-lg hover:opacity-90 transition-opacity"
                >
                  Visit Advanced Health Solutions
                </a>
              </div>
            </div>

            {/* Lineup Image */}
            <div className="max-w-5xl mx-auto">
              <img
                src="/images/Final Lineup.png"
                alt="Official Beats on the Block 2026 performer lineup"
                className="w-full h-auto"
              />
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
