import { useState, useEffect, useRef } from 'react'
import SEO from '../components/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Image from 'next/image'
import { Mail, User, Phone, Building2, Briefcase, ChevronLeft, ChevronRight, X } from 'lucide-react'
import * as gtag from '../lib/gtag'

interface SponsorFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  productIndustry: string;
}

export default function SponsorInquiries() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const formRef = useRef<HTMLDivElement>(null)

  // Gallery state
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  // Form state
  const [formData, setFormData] = useState<SponsorFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    productIndustry: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

  // Sponsor deck images (1.webp through 14.webp) - Optimized from 30MB to 2MB
  const sponsorDeckImages = Array.from({ length: 14 }, (_, i) => `/images/sponsors/sponsor_deck/${i + 1}.webp`)

  // Auto-cycle gallery every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sponsorDeckImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [sponsorDeckImages.length])

  // Track scroll direction to sync with header visibility
  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false)
      } else {
        setIsHeaderVisible(true)
      }

      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle gallery navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sponsorDeckImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sponsorDeckImages.length) % sponsorDeckImages.length)
  }

  // Open full gallery modal
  const openGallery = (index: number) => {
    setGalleryIndex(index)
    setIsGalleryOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeGallery = () => {
    setIsGalleryOpen(false)
    document.body.style.overflow = 'auto'
  }

  const nextGalleryImage = () => {
    setGalleryIndex((prev) => (prev + 1) % sponsorDeckImages.length)
  }

  const prevGalleryImage = () => {
    setGalleryIndex((prev) => (prev - 1 + sponsorDeckImages.length) % sponsorDeckImages.length)
  }

  // Handle keyboard navigation in gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGalleryOpen) return
      if (e.key === 'ArrowRight') nextGalleryImage()
      if (e.key === 'ArrowLeft') prevGalleryImage()
      if (e.key === 'Escape') closeGallery()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGalleryOpen])

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value } as SponsorFormData))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch('/api/forms/sponsor-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSubmitStatus('success')
        gtag.trackFormSubmission('Sponsor Inquiry')
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        setFormData({ name: '', email: '', phone: '', company: '', productIndustry: '' })
        setTimeout(() => setSubmitStatus(null), 5000)
      } else {
        setSubmitStatus('error')
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setSubmitStatus('error')
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SEO
        title="Sponsor Inquiries | Beats on the Beltline"
        description="Interested in sponsoring Beats on the Beltline 2026? Partner with Atlanta's premier free outdoor electronic music festival reaching 5,000-10,000 attendees."
        canonicalUrl="https://connectevents.co/sponsor-inquiries"
      />

      <Header />

      <main className="pt-28 md:pt-[3.5rem]">
        {/* Hero Section with Gradient */}
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

          {/* Hero Gallery - Sponsor Deck */}
          <div className="pb-4">
            <div className="section-container max-w-6xl">
              <div className="relative max-w-5xl mx-auto">
                  {/* Gallery Slider */}
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl bg-black border-2 border-brand-primary/20">
                    {sponsorDeckImages.map((img, index) => (
                      <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-500 cursor-pointer ${
                          index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                        onClick={() => openGallery(index)}
                      >
                        <Image
                          src={img}
                          alt={`Sponsor Deck Page ${index + 1}`}
                          fill
                          className="object-contain p-2"
                          priority={index === 0}
                        />
                      </div>
                    ))}

                    {/* Navigation Arrows */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        prevSlide()
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle bg-black/40 hover:bg-black/60 border-2 border-white/20 hover:border-white/40 shadow-lg z-10"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft size={24} className="text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        nextSlide()
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle bg-black/40 hover:bg-black/60 border-2 border-white/20 hover:border-white/40 shadow-lg z-10"
                      aria-label="Next slide"
                    >
                      <ChevronRight size={24} className="text-white" />
                    </button>

                    {/* Slide Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {sponsorDeckImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCurrentSlide(index)
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentSlide
                              ? 'bg-brand-primary w-8'
                              : 'bg-gray-400/40 hover:bg-gray-400/60'
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Page Counter */}
                  <div className="text-center mt-4 text-brand-text font-semibold">
                    Page {currentSlide + 1} of {sponsorDeckImages.length}
                  </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="bg-brand-bg py-12 md:py-20">
          <div className="section-container max-w-6xl">
            {/* Info Header */}
              <div className="text-center mb-12">
                <h2 className="font-title text-4xl md:text-6xl font-black mb-6 text-brand-header uppercase">
                  Let's work together
                </h2>
                <p className="text-xl text-brand-text font-bold max-w-2xl mx-auto">
                  Interested in being a Sponsor for 2026 BOTB? Please fill out the form below and a team member will reach out!
                </p>
              </div>

              {/* Form Section with Messages */}
              <div ref={formRef}>
                {/* Success/Error Messages */}
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
                    <p className="text-green-800 font-semibold">
                      🎉 Thank you for your interest! A team member will reach out to you soon.
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg text-center">
                    <p className="text-red-800 font-semibold">
                      ❌ Oops! Something went wrong. Please try again.
                    </p>
                  </div>
                )}

                {/* Sponsor Inquiry Form */}
                <div className="relative p-4 md:p-8 rounded-2xl overflow-hidden shadow-xl bg-white">
                  <form
                    onSubmit={handleSubmit}
                    className="relative z-10 space-y-6"
                  >
                  {/* Name */}
                  <div className="form-control">
                    <label className="label flex-col items-start">
                      <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                        <User size={16} className="inline mr-2" />
                        Name *
                      </span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      className="input input-bordered w-full focus:input-primary"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          <Mail size={16} className="inline mr-2" />
                          Email *
                        </span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="input input-bordered w-full focus:input-primary"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          <Phone size={16} className="inline mr-2" />
                          Phone Number *
                        </span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(555) 123-4567"
                        className="input input-bordered w-full focus:input-primary"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div className="form-control">
                    <label className="label flex-col items-start">
                      <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                        <Building2 size={16} className="inline mr-2" />
                        Company *
                      </span>
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Your company name"
                      className="input input-bordered w-full focus:input-primary"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {/* Product/Industry */}
                  <div className="form-control">
                    <label className="label flex-col items-start">
                      <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                        <Briefcase size={16} className="inline mr-2" />
                        Product/Industry *
                      </span>
                    </label>
                    <textarea
                      name="productIndustry"
                      value={formData.productIndustry}
                      onChange={handleInputChange}
                      className="textarea textarea-bordered h-24 focus:textarea-primary w-full"
                      placeholder="Tell us about your product or industry..."
                      disabled={isSubmitting}
                      required
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-festival btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Briefcase size={20} className="inline mr-2" />
                      {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Full Gallery Modal */}
        {isGalleryOpen && (
          <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeGallery}
              className="absolute top-4 right-4 btn btn-circle bg-white/10 hover:bg-white/20 border-white/20 z-10"
              aria-label="Close gallery"
            >
              <X size={24} className="text-white" />
            </button>

            {/* Gallery Image */}
            <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
              <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
                <Image
                  src={sponsorDeckImages[galleryIndex]}
                  alt={`Sponsor Deck Page ${galleryIndex + 1}`}
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Navigation */}
            <button
              onClick={prevGalleryImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle bg-white/10 hover:bg-white/20 border-white/20"
              aria-label="Previous image"
            >
              <ChevronLeft size={32} className="text-white" />
            </button>
            <button
              onClick={nextGalleryImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle bg-white/10 hover:bg-white/20 border-white/20"
              aria-label="Next image"
            >
              <ChevronRight size={32} className="text-white" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-lg font-semibold bg-black/50 px-4 py-2 rounded-full">
              {galleryIndex + 1} / {sponsorDeckImages.length}
            </div>

            {/* Thumbnails */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-full px-4">
              {sponsorDeckImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setGalleryIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === galleryIndex
                      ? 'border-brand-primary scale-110'
                      : 'border-white/20 hover:border-white/60'
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
