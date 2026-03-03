import SEO from '../components/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Image from 'next/image'

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
        {/* Hero + Merch Grid Section Combined */}
        <section className="py-8 md:py-12 relative overflow-hidden hero-gradient-gold">
          <div className="section-container relative z-10">
            {/* Hero Title & Subtitle */}
            <div className="text-center mb-12">
              <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black mb-8 uppercase bg-gradient-to-r from-brand-pink via-brand-peach to-brand-primary bg-clip-text text-transparent">
                Merch
              </h1>
              <p className="text-2xl md:text-3xl text-brand-text font-bold max-w-4xl mx-auto">
                Rep the festival with official gear
              </p>
            </div>

            {/* Merch Grid Content */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
              {/* Merch Items */}
              {[
                { 
                  name: 'Beats on the Beltline 2025 White Tee', 
                  price: '$35.00', 
                  image: '/images/merch/whitetshirt.jpg',
                  url: 'https://connectmerch-shop.fourthwall.com/products/beats-on-the-beltline-2025-white-tee'
                },
                { 
                  name: 'Beats on the Beltline 2025 Black Retro Tee', 
                  price: '$35.00', 
                  image: '/images/merch/retrotee.jpg',
                  url: 'https://connectmerch-shop.fourthwall.com/products/beats-on-the-beltline-2025-retro-tee-2'
                },
                { 
                  name: 'Beats on the Beltline 2025 Disco Tee', 
                  price: '$35.00', 
                  image: '/images/merch/discotee.jpg',
                  url: 'https://connectmerch-shop.fourthwall.com/products/beats-on-the-beltline-2025-disco-tee-2'
                },
                { 
                  name: 'Beats on the Beltline Circle Sticker', 
                  price: '$4.00', 
                  image: '/images/merch/circle sticker.png',
                  url: 'https://connectmerch-shop.fourthwall.com/products/beats-on-the-beltline-circle-sticker'
                },
                { 
                  name: 'Beats on the Beltline Block Sticker', 
                  price: '$4.00', 
                  image: '/images/merch/blocksticker.png',
                  url: 'https://connectmerch-shop.fourthwall.com/products/beats-on-the-beltline-block-sticker'
                },
              ].map((item, idx) => (
                <a 
                  key={idx} 
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-brand-bg-cream border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-md hover:border-brand-primary hover:shadow-xl transition-all group cursor-pointer"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-brand-header mb-3 leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-2xl font-bold text-brand-primary">
                      {item.price}
                    </p>
                  </div>
                </a>
              ))}
              </div>

              {/* Purchase Info */}
              <div className="text-center max-w-3xl mx-auto">
              <div className="bg-brand-bg-cream border-2 border-brand-primary/20 p-8 rounded-2xl shadow-lg">
                <h2 className="font-title text-3xl md:text-5xl font-black mb-4 text-brand-header uppercase">
                  Get Your Merch
                </h2>
                <p className="text-xl text-brand-header/80 mb-6">
                  All merchandise is available for purchase at our events. Follow us on social media for announcements about upcoming festivals and merch drops!
                </p>
                <p className="text-lg text-brand-header/70">
                  Can't make it to an event? Order online anytime.
                </p>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 md:py-20 bg-brand-bg">
          <div className="section-container max-w-4xl">
            <h2 className="font-title text-4xl md:text-6xl font-black text-center mb-12 text-brand-header uppercase">
              Why Shop With Us?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mb-4 text-brand-primary flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 7h-9"></path>
                    <path d="M14 17H5"></path>
                    <circle cx="17" cy="17" r="3"></circle>
                    <circle cx="7" cy="7" r="3"></circle>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-brand-header mb-2">Quality Materials</h3>
                <p className="text-brand-header/70">Premium fabrics and prints that last</p>
              </div>

              <div className="text-center">
                <div className="mb-4 text-brand-primary flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-brand-header mb-2">Fast Shipping</h3>
                <p className="text-brand-header/70">Get your gear delivered quickly</p>
              </div>

              <div className="text-center">
                <div className="mb-4 text-brand-primary flex justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-brand-header mb-2">Support the Scene</h3>
                <p className="text-brand-header/70">Your purchase supports local music</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  )
}

