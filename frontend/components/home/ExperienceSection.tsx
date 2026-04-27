import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export default function ExperienceSection() {
  const [cardsVisible, setCardsVisible] = useState(false)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCardsVisible(true)
      },
      { threshold: 0.2 }
    )
    const currentRef = cardsRef.current
    if (currentRef) observer.observe(currentRef)
    return () => { if (currentRef) observer.unobserve(currentRef) }
  }, [])

  return (
    <section id="experience" className="pt-4 pb-6 md:pt-6 md:pb-10 bg-brand-bg-cream">
      <div className="section-container">
        <h1 className="text-center mb-4">
          <span className="block font-festival text-6xl md:text-8xl lg:text-9xl font-black uppercase bg-gradient-to-r from-brand-primary via-brand-accent to-brand-pink bg-clip-text text-transparent">
            Beats
          </span>
          <span className="block font-title text-3xl md:text-4xl lg:text-5xl font-semibold text-brand-text/70 my-2">
            on the
          </span>
          <span className="block font-festival text-6xl md:text-8xl lg:text-9xl font-black uppercase bg-gradient-to-r from-brand-pink via-brand-peach to-brand-primary bg-clip-text text-transparent">
            Beltline
          </span>
        </h1>

        <p className="text-xl md:text-2xl font-bold text-center text-brand-text mb-12 max-w-4xl mx-auto">
          Atlanta's premier FREE outdoor electronic music experience
        </p>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className={`card-bg-white border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-md hover:border-brand-primary transition-all hover:shadow-lg ${cardsVisible ? 'animate-[fadeInUp_0.6s_ease-out_0.1s_both]' : 'opacity-0'}`}>
            <div className="h-32 relative overflow-hidden">
              <Image src="/images/the mission pic.jpg" alt="The Mission" fill className="object-cover" />
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-brand-header mb-4">The Mission</h3>
              <p className="text-brand-header/80 leading-relaxed">
                To create unforgettable daytime experiences where music and nature meet, bringing people together under the sun. It's all about community, uplifting energy, and making lasting memories through music, sunshine, and shared moments.
              </p>
            </div>
          </div>

          <div className={`card-bg-white border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-md hover:border-brand-primary transition-all hover:shadow-lg ${cardsVisible ? 'animate-[fadeInUp_0.6s_ease-out_0.3s_both]' : 'opacity-0'}`}>
            <div className="h-32 relative overflow-hidden">
              <Image src="/images/the music pic.jpg" alt="The Music" fill className="object-cover" />
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-brand-header mb-4">The Music</h3>
              <p className="text-brand-header/80 leading-relaxed">
                Connect Atlanta highlights Atlanta based DJs across a variety of genres of dance music. Each lineup is curated to reflect diversity, community, and the sounds driving the city's dance culture forward.
              </p>
            </div>
          </div>

          <div className={`card-bg-white border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-md hover:border-brand-primary transition-all hover:shadow-lg ${cardsVisible ? 'animate-[fadeInUp_0.6s_ease-out_0.5s_both]' : 'opacity-0'}`}>
            <div className="h-32 relative overflow-hidden">
              <Image src="/images/the community pic web.jpg" alt="The Community" fill className="object-cover" />
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-brand-header mb-4">The Community</h3>
              <p className="text-brand-header/80 leading-relaxed">
                Local food vendors, artists, and brands come together to create an immersive festival experience. Beats on the Block is a celebration of Atlanta's creative spirit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
