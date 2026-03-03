import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import SEO from '../components/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ConnectModal from '../components/ConnectModal'
import Image from 'next/image'
import { Music, Headphones, Users, Camera } from 'lucide-react'
import { organizationSchema, websiteSchema, eventSeriesSchema, faqSchema } from '../lib/structuredData'

interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  marketingConsent: boolean;
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cardsVisible, setCardsVisible] = useState(false)
  const cardsRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Form state for bottom signup form
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    phone: '',
    marketingConsent: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

  // Intersection Observer for cards animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCardsVisible(true)
        }
      },
      {
        threshold: 0.2, // Trigger when 20% of the element is visible
      }
    )

    const currentRef = cardsRef.current

    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    } as SignupFormData))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch('/api/forms/email-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          marketing_consent: formData.marketingConsent,
          source: 'website'
        })
      })

      if (response.ok) {
        setSubmitStatus('success')
        // Scroll to form top to show message
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        // Reset form after 3 seconds
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            phone: '',
            marketingConsent: false
          })
          setSubmitStatus(null)
        }, 3000)
      } else {
        const data = await response.json() as { error?: string }
        setSubmitStatus('error')
        console.error('Signup failed:', data)
        // Scroll to form top to show error
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
      // Scroll to form top to show error
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SEO
        title="Beats on the Beltline | Atlanta's Premier Free Outdoor Electronic Music Experience"
        description="Atlanta's premier free outdoor electronic music festival. Join 5,000-10,000 attendees for world-class DJs, local vendors, and community vibes along the Beltline."
        keywords="beats on the beltline, atlanta music festival, beltline, electronic music, free festival, atlanta edm, house music, techno"
        canonicalUrl="https://connectevents.co"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [organizationSchema, websiteSchema, eventSeriesSchema, faqSchema]
        }}
      />

      <div className="min-h-screen bg-brand-bg">
        <Header />

        {/* Hero Section with Cards */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-8 hero-gradient-gold">
          <div className="section-container relative z-10 w-full">

            {/* Hero Logo & Title - Desktop Only */}
            <div className="text-center mb-12 md:mb-16 hidden md:block">
              <div className="relative inline-block mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-radial from-yellow-200/40 via-yellow-100/20 to-transparent blur-3xl scale-110"></div>
                <img
                  src="/images/ConnectLogoBIG-Black.svg"
                  alt="Connect"
                  className="relative w-auto h-48 mx-auto"
                />
              </div>
              <h1 className="font-slogan text-3xl md:text-4xl lg:text-5xl text-brand-text tracking-wider uppercase mb-4">
                Home of Beats on the Beltline
              </h1>
            </div>

            {/* Hero Cards Grid - Modern Landscape Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">

              {/* Beats on the Beltline Card */}
              <a href="https://bit.ly/botbapril" target="_blank" rel="noopener noreferrer" className="block h-full">
                <div className="relative border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-lg hover:border-brand-primary hover:shadow-2xl transition-all group h-full">
                  <div className="relative aspect-[4/3] md:aspect-[3/4] overflow-hidden">
                    {/* Background Image */}
                    <Image
                      src="/images/RR-9.jpg"
                      alt="Beats on the Beltline"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20"></div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <div className="mb-3">
                        <Headphones size={36} className="text-white mb-2" strokeWidth={1.5} />
                      </div>
                      <h2 className="font-title text-xl md:text-2xl font-black text-white mb-3 uppercase hero-card-title animate-slide-down animate-delay-100 md:min-h-[3.5rem]">
                        Beats on the Beltline
                      </h2>
                      <p className="text-white/90 mb-4 text-sm leading-relaxed md:min-h-[3rem]">
                        Atlanta's premier free outdoor electronic music experience is April 25th!
                      </p>
                      <div className="btn-festival w-full relative z-10 text-center pointer-events-none">
                        Attend Next Event
                      </div>
                    </div>
                  </div>
                </div>
              </a>

              {/* Merch Card */}
              <Link href="/merch" className="block h-full">
                <div className="relative border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-lg hover:border-brand-primary hover:shadow-2xl transition-all group h-full">
                  <div className="relative aspect-[4/3] md:aspect-[3/4] overflow-hidden">
                    {/* Background Image */}
                    <Image
                      src="/images/merch/discotee.jpg"
                      alt="Connect Merchandise"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20"></div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <div className="mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white mb-2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                      </div>
                      <h3 className="font-title text-2xl md:text-3xl font-black text-white mb-3 uppercase hero-card-title animate-slide-down animate-delay-200 md:min-h-[3.5rem]">
                        Merch
                      </h3>
                      <p className="text-white/90 mb-4 text-sm leading-relaxed md:min-h-[3rem]">
                        Rep the festival with official gear and apparel.
                      </p>
                      <button className="btn-festival w-full">
                        Shop Now
                      </button>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Join Us Card */}
              <Link href="/join" className="block h-full">
                <div className="relative border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-lg hover:border-brand-primary hover:shadow-2xl transition-all group h-full">
                  <div className="relative aspect-[4/3] md:aspect-[3/4] overflow-hidden">
                    {/* Background Image */}
                    <Image
                      src="/images/vendor pic 2 - webiste.jpg"
                      alt="Join Us"
                      fill
                      className="object-cover object-left group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20"></div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <div className="mb-3">
                        <Users size={36} className="text-white mb-2" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-title text-2xl md:text-3xl font-black text-white mb-3 uppercase hero-card-title animate-slide-down animate-delay-300 md:min-h-[3.5rem]">
                        Join Us
                      </h3>
                      <p className="text-white/90 mb-4 text-sm leading-relaxed md:min-h-[3rem]">
                        Volunteer, perform, or vend at our events.
                      </p>
                      <button className="btn-festival w-full">
                        Get Involved
                      </button>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Event Gallery Card */}
              <Link href="/gallery" className="block h-full">
                <div className="relative border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-lg hover:border-brand-primary hover:shadow-2xl transition-all group h-full">
                  <div className="relative aspect-[4/3] md:aspect-[3/4] overflow-hidden">
                    {/* Background Image */}
                    <Image
                      src="/images/event gallery pic 1.jpg"
                      alt="Event Gallery"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20"></div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <div className="mb-3">
                        <Camera size={36} className="text-white mb-2" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-title text-xl md:text-2xl font-black text-white mb-3 uppercase hero-card-title animate-slide-down animate-delay-300 md:min-h-[3.5rem]">
                        Event Gallery
                      </h3>
                      <p className="text-white/90 mb-4 text-sm leading-relaxed md:min-h-[3rem]">
                        Check out our vibe.
                      </p>
                      <button className="btn-festival w-full">
                        View Gallery
                      </button>
                    </div>
                  </div>
                </div>
              </Link>

            </div>
          </div>
        </section>

        {/* Connect Modal */}
        <ConnectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

        {/* About Section - The Experience */}
        <section id="experience" className="pt-4 pb-6 md:pt-6 md:pb-10 bg-brand-bg-cream">
          <div className="section-container">
            {/* Beats on the Beltline Title - Festival Style */}
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

            {/* Hero Tagline */}
            <p className="text-xl md:text-2xl font-bold text-center text-brand-text mb-12 max-w-4xl mx-auto">
              Atlanta's premier FREE outdoor electronic music experience
            </p>

            {/* Outlined Content Cards */}
            <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

              {/* The Vision */}
              <div className={`card-bg-white border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-md hover:border-brand-primary transition-all hover:shadow-lg ${cardsVisible ? 'animate-[fadeInUp_0.6s_ease-out_0.1s_both]' : 'opacity-0'}`}>
                {/* Image Header Strip */}
                <div className="h-32 relative overflow-hidden">
                  <Image
                    src="/images/the mission pic.jpg"
                    alt="The Mission"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-brand-header mb-4">The Mission</h3>
                  <p className="text-brand-header/80 leading-relaxed">
                    To create unforgettable daytime experiences where music and nature meet, bringing people together under the sun. It's all about community, uplifting energy, and making lasting memories through music, sunshine, and shared moments.
                  </p>
                </div>
              </div>

              {/* The Music */}
              <div className={`card-bg-white border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-md hover:border-brand-primary transition-all hover:shadow-lg ${cardsVisible ? 'animate-[fadeInUp_0.6s_ease-out_0.3s_both]' : 'opacity-0'}`}>
                {/* Image Header Strip */}
                <div className="h-32 relative overflow-hidden">
                  <Image
                    src="/images/the music pic.jpg"
                    alt="The Music"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-brand-header mb-4">The Music</h3>
                  <p className="text-brand-header/80 leading-relaxed">
                    Connect Atlanta highlights Atlanta based DJs across a variety of genres of dance music. Each lineup is curated to reflect diversity, community, and the sounds driving the city's dance culture forward.
                  </p>
                </div>
              </div>

              {/* The Community */}
              <div className={`card-bg-white border-2 border-brand-primary/20 rounded-2xl overflow-hidden shadow-md hover:border-brand-primary transition-all hover:shadow-lg ${cardsVisible ? 'animate-[fadeInUp_0.6s_ease-out_0.5s_both]' : 'opacity-0'}`}>
                {/* Image Header Strip */}
                <div className="h-32 relative overflow-hidden">
                  <Image
                    src="/images/the community pic web.jpg"
                    alt="The Community"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-brand-header mb-4">The Community</h3>
                  <p className="text-brand-header/80 leading-relaxed">
                    Local food vendors, artists, and brands come together to create an immersive festival experience. Beats on the Beltline is a celebration of Atlanta's creative spirit.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Upcoming Events Section */}
        <section id="events" className="py-6 md:py-10 bg-brand-bg">
          <div className="section-container">
            <h2 className="font-title text-5xl md:text-7xl font-black text-center mb-10 text-brand-header uppercase">
              Upcoming Events
            </h2>

            <div className="max-w-md mx-auto">
              <div className="card-bg-white border-2 border-brand-neutral-100 rounded-2xl overflow-hidden hover:border-brand-primary hover:shadow-xl transition-all">
                <div className="relative aspect-auto bg-brand-bg-cream">
                  <Image
                    src="/images/events/april-2026.webp"
                    alt="Beats on the Beltline - April 2026"
                    width={1080}
                    height={1350}
                    className="object-contain w-full h-full"
                    priority
                  />
                  <span className="bg-brand-primary text-white absolute top-4 right-4 font-semibold px-6 py-2 rounded-full">FREE</span>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-brand-header mb-4 text-center">
                    Beats on the Beltline
                  </h3>
                  <p className="text-brand-text mb-6 text-center">
                    Atlanta's premier free outdoor electronic music experience is April 25th!
                  </p>
                  <a
                    href="https://bit.ly/botbapril"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-festival w-full block text-center"
                  >
                    Attend Next Event
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Past Events Section */}
        <section className="py-6 md:py-10 bg-brand-bg">
          <div className="section-container">
            <h2 className="font-title text-5xl md:text-7xl font-black text-center mb-10 text-brand-header uppercase">
              PAST EVENTS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Past Event Cards - Real Flyers (displayed newest to oldest) */}
              {[
                { image: '/images/events/september-2025.png', alt: 'Beats on the Beltline - September 2025' },
                { image: '/images/events/sept-2025-after.png', alt: 'Beats on the Beltline - September Afterparty' },
                { image: '/images/events/sept-2025-after2.png', alt: 'Beats on the Beltline - September Afterparty 2' },
                { image: '/images/events/july-2025.png', alt: 'Beats on the Beltline - July 2025' },
                { image: '/images/events/july-2025-after.png', alt: 'Beats on the Beltline - July Afterparty' },
                { image: '/images/events/may-2025.png', alt: 'Beats on the Beltline - May 2025' },
                { image: '/images/events/may-2025-after.jpg', alt: 'Beats on the Beltline - May Afterparty' },
                { image: '/images/events/april-2025.png', alt: 'Beats on the Beltline - April 2025' }
              ].map((event, idx) => (
                <div key={idx} className="card-festival">
                  <div className="relative aspect-auto rounded-xl overflow-hidden">
                    <Image
                      src={event.image}
                      alt={event.alt}
                      width={1080}
                      height={1350}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sponsors Section */}
        <section className="py-6 md:py-10 hero-bg-gold">
          <div className="section-container">
            <h2 className="font-title text-3xl md:text-4xl font-black text-center mb-6 text-brand-header uppercase">
              Sponsors
            </h2>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 items-center max-w-3xl mx-auto">
              {/* Sponsor Logos - Compact */}
              {[
                { name: 'Coke Zero', logo: '/images/sponsors/coke-zero.svg' },
                { name: 'Deep Eddy', logo: '/images/sponsors/deep-eddy.svg' },
                { name: 'Lunazul', logo: '/images/sponsors/lunazul.svg' },
                { name: 'EVDY', logo: '/images/sponsors/evdy.svg' },
                { name: 'Simply Pop', logo: '/images/sponsors/simply-pop.svg' },
                { name: 'Nine Dot', logo: '/images/sponsors/nine-dot.svg' },
                { name: 'Amiqo', logo: '/images/sponsors/amiqo.svg' },
                { name: '4Ever Young', logo: '/images/sponsors/4ever-young.svg' },
                { name: 'Sub Riot', logo: '/images/sponsors/sub-riot.svg' },
              ].map((sponsor, idx) => {
                // Apply smaller max-height to specific logos that are too tall
                const needsSmallerHeight = ['Simply Pop', 'Amiqo', '4Ever Young'].includes(sponsor.name);
                const needsLargerHeight = ['Sub Riot'].includes(sponsor.name);
                const heightClass = needsSmallerHeight ? 'max-h-[35px]' : needsLargerHeight ? 'max-h-[65px]' : 'max-h-[50px]';
                const widthClass = needsLargerHeight ? 'max-w-[80px]' : 'max-w-[60px]';

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-center hover:scale-110 transition-transform cursor-pointer p-1"
                  >
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      width="100"
                      height="80"
                      className={`object-contain ${widthClass} ${heightClass} h-auto opacity-100 transition-opacity`}
                      loading="lazy"
                    />
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* Connect with Us Section */}
        <section id="join" className="py-6 md:py-10 bg-brand-bg">
          <div className="section-container text-center">
            <h2 className="font-title text-5xl md:text-7xl font-black mb-8 text-brand-header uppercase flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
              <span>Let's</span>
              <img
                src="/images/Justconnect.png"
                alt="Connect"
                className="h-10 md:h-14 w-auto"
              />
            </h2>

            <div className="max-w-3xl mx-auto space-y-6 mb-12">
              <p className="text-xl leading-relaxed text-brand-header">
                Be part of Atlanta's most vibrant music community. Whether you're a DJ, artist, vendor, or music lover, there's a place for you at Beats on the Beltline.
              </p>
              <p className="text-lg leading-relaxed text-brand-header/70">
                Stay updated on upcoming events, lineup announcements, giveaways, and exclusive content.
              </p>
            </div>

            {/* Success Message */}
            {submitStatus === 'success' && (
              <div className="max-w-2xl mx-auto mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
                <p className="text-green-800 font-semibold">
                  🎉 Thank you for signing up! We'll keep you updated on upcoming events.
                </p>
              </div>
            )}

            {/* Error Message */}
            {submitStatus === 'error' && (
              <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg text-center">
                <p className="text-red-800 font-semibold">
                  ❌ Oops! Something went wrong. Please try again.
                </p>
              </div>
            )}

            {/* Connect Form */}
            <div className="max-w-2xl mx-auto">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 card-bg-white border-2 border-brand-primary/20 rounded-2xl p-8 shadow-lg">
                {/* Name Field */}
                <div className="text-left">
                  <label htmlFor="name" className="block text-brand-header font-semibold mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="input input-bordered w-full focus:input-primary"
                    placeholder="Your full name"
                  />
                </div>

                {/* Email Field */}
                <div className="text-left">
                  <label htmlFor="email" className="block text-brand-header font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="input input-bordered w-full focus:input-primary"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Phone Field */}
                <div className="text-left">
                  <label htmlFor="phone" className="block text-brand-header font-semibold mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="input input-bordered w-full focus:input-primary"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Marketing Consent Checkbox */}
                <div className="text-left flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="marketing-consent"
                    name="marketingConsent"
                    checked={formData.marketingConsent}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="checkbox checkbox-primary mt-1"
                  />
                  <label htmlFor="marketing-consent" className="text-brand-header/80 text-sm leading-relaxed cursor-pointer">
                    I agree to receive marketing communications, event updates, and exclusive content from Beats on the Beltline. You can unsubscribe at any time.
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-festival btn-lg w-full text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'CONNECTING...' : 'CONNECT WITH US'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
