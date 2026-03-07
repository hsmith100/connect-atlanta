import { useState, useEffect, useRef } from 'react'
import SEO from '../components/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Image from 'next/image'
import { Music, Users, Mail, User, Phone, MapPin, Link as LinkIcon, MessageSquare, Store, Headphones } from 'lucide-react'
import * as gtag from '../lib/gtag'

interface ArtistFormData {
  email: string
  fullLegalName: string
  djName: string
  city: string
  phone: string
  instagramLink: string
  contactMethod: string
  artistBio: string
  b2bFavorite: string
  mainGenre: string
  subGenre: string
  otherSubGenre: string
  otherGenreText: string
  livePerformanceLinks: string
  soundcloudLink: string
  spotifyLink: string
  rekordboxFamiliar: string
  promoKitLinks: string
  additionalInfo: string
}

export default function JoinUs() {
  const [activeTab, setActiveTab] = useState<'volunteer' | 'vendor' | 'dj'>('dj')
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)

  // Form refs for scrolling
  const artistFormRef = useRef<HTMLFormElement>(null)

  // Artist/DJ form state
  const [artistData, setArtistData] = useState<ArtistFormData>({
    email: '',
    fullLegalName: '',
    djName: '',
    city: '',
    phone: '',
    instagramLink: '',
    contactMethod: 'email',
    artistBio: '',
    b2bFavorite: '',
    mainGenre: '',
    subGenre: '',
    otherSubGenre: '',
    otherGenreText: '',
    livePerformanceLinks: '',
    soundcloudLink: '',
    spotifyLink: '',
    rekordboxFamiliar: '',
    promoKitLinks: '',
    additionalInfo: ''
  })
  const [artistSubmitting, setArtistSubmitting] = useState(false)
  const [artistStatus, setArtistStatus] = useState<'success' | 'error' | null>(null)

  // Track scroll direction to sync with header visibility
  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsHeaderVisible(false)
      } else {
        // Scrolling up
        setIsHeaderVisible(true)
      }

      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToForm = (tab: 'volunteer' | 'vendor' | 'dj'): void => {
    setActiveTab(tab)
    // Wait for state to update and scroll to form
    setTimeout(() => {
      const formSection = document.getElementById('application-form')
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Artist/DJ form handlers
  const handleArtistChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target
    setArtistData(prev => ({ ...prev, [name]: value } as ArtistFormData))
  }

  const handleArtistSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setArtistSubmitting(true)
    setArtistStatus(null)

    try {
      const response = await fetch('/api/forms/artist-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: artistData.email,
          fullLegalName: artistData.fullLegalName,
          djName: artistData.djName,
          city: artistData.city,
          phone: artistData.phone,
          instagramLink: artistData.instagramLink,
          contactMethod: artistData.contactMethod,
          artistBio: artistData.artistBio,
          b2bFavorite: artistData.b2bFavorite,
          mainGenre: artistData.mainGenre,
          subGenre: artistData.subGenre,
          otherSubGenre: artistData.otherSubGenre,
          otherGenreText: artistData.otherGenreText || null,
          livePerformanceLinks: artistData.livePerformanceLinks,
          soundcloudLink: artistData.soundcloudLink || null,
          spotifyLink: artistData.spotifyLink || null,
          rekordboxFamiliar: artistData.rekordboxFamiliar,
          promoKitLinks: artistData.promoKitLinks || null,
          additionalInfo: artistData.additionalInfo || null
        })
      })

      if (response.ok) {
        setArtistStatus('success')
        gtag.trackDJApplication()
        // Scroll to form top to show message
        if (artistFormRef.current) {
          artistFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        setArtistData({
          email: '',
          fullLegalName: '',
          djName: '',
          city: '',
          phone: '',
          instagramLink: '',
          contactMethod: 'email',
          artistBio: '',
          b2bFavorite: '',
          mainGenre: '',
          subGenre: '',
          otherSubGenre: '',
          otherGenreText: '',
          livePerformanceLinks: '',
          soundcloudLink: '',
          spotifyLink: '',
          rekordboxFamiliar: '',
          promoKitLinks: '',
          additionalInfo: ''
        })
        setTimeout(() => setArtistStatus(null), 5000)
      } else {
        setArtistStatus('error')
        // Scroll to form top to show error
        if (artistFormRef.current) {
          artistFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setArtistStatus('error')
      // Scroll to form top to show error
      if (artistFormRef.current) {
        artistFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } finally {
      setArtistSubmitting(false)
    }
  }

  return (
    <>
      <SEO
        title="Join Us | Beats on the Beltline"
        description="Join Beats on the Beltline as a volunteer, vendor, or DJ. Be part of Atlanta's premier free outdoor electronic music experience."
        canonicalUrl="https://yourfestival.com/join"
      />

      <Header />

      <main className="pt-28 md:pt-[3.5rem]">
        {/* Combined Hero + Forms Section with Gradient */}
        <section className="relative overflow-hidden hero-gradient-gold">
          {/* Hero */}
          <div className="py-8">
            <div className="section-container relative z-10">
              <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black text-center mb-8 uppercase bg-gradient-to-r from-brand-pink via-brand-peach to-brand-primary bg-clip-text text-transparent">
                Join Us
              </h1>
              <p className="text-2xl md:text-3xl text-center text-brand-text font-bold max-w-4xl mx-auto">
                Be part of Atlanta's most vibrant festival community
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={`sticky z-40 bg-brand-bg/80 backdrop-blur-sm border-b-2 border-brand-neutral-100 transition-all duration-300 ${isHeaderVisible ? 'top-28' : 'top-0'} md:top-[3.5rem]`}>
            <div className="section-container py-0">
              <div className="flex justify-center">
                <button
                  onClick={() => scrollToForm('volunteer')}
                  className={`flex items-center gap-1 md:gap-2 px-3 md:px-8 py-4 font-title font-bold text-sm md:text-lg transition-all ${activeTab === 'volunteer'
                    ? 'text-brand-primary border-b-4 border-brand-primary bg-brand-bg/30'
                    : 'text-brand-text/60 hover:text-brand-primary hover:bg-brand-bg/20'
                    }`}
                >
                  <Users size={18} className="md:w-5 md:h-5" />
                  Volunteer
                </button>
                <button
                  onClick={() => scrollToForm('vendor')}
                  className={`flex items-center gap-1 md:gap-2 px-3 md:px-8 py-4 font-title font-bold text-sm md:text-lg transition-all ${activeTab === 'vendor'
                    ? 'text-brand-primary border-b-4 border-brand-primary bg-brand-bg/30'
                    : 'text-brand-text/60 hover:text-brand-primary hover:bg-brand-bg/20'
                    }`}
                >
                  <Store size={18} className="md:w-5 md:h-5" />
                  Vendor
                </button>
                <button
                  onClick={() => scrollToForm('dj')}
                  className={`flex items-center gap-1 md:gap-2 px-3 md:px-8 py-4 font-title font-bold text-sm md:text-lg transition-all ${activeTab === 'dj'
                    ? 'text-brand-primary border-b-4 border-brand-primary bg-brand-bg/30'
                    : 'text-brand-text/60 hover:text-brand-primary hover:bg-brand-bg/20'
                    }`}
                >
                  <Music size={18} className="md:w-5 md:h-5" />
                  DJ
                </button>
              </div>
            </div>
          </div>

          {/* Volunteer */}
          {activeTab === 'volunteer' && (
            <div id="application-form" className="py-12 md:py-20">
              <div className="section-container max-w-4xl">
                <div className="text-center mb-12">
                  <div className="mb-6 text-brand-primary flex justify-center">
                    <Users size={64} strokeWidth={1.5} />
                  </div>
                  <h2 className="font-title text-4xl md:text-6xl font-black mb-6 text-brand-header uppercase">
                    Volunteer Application
                  </h2>
                  <p className="text-xl text-brand-text font-bold max-w-2xl mx-auto">
                    Help make the magic happen! Join our volunteer team and be part of creating an unforgettable experience.
                  </p>
                </div>

                <div className="text-center">
                  <a
                    href="https://forms.gle/fWyoSrm2koijynxS7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-festival btn-lg inline-flex items-center gap-2"
                    onClick={() => gtag.trackVolunteerApplication()}
                  >
                    <Users size={20} />
                    Apply to Volunteer
                  </a>
                </div>

              </div>
            </div>
          )}

          {/* Vendor */}
          {activeTab === 'vendor' && (
            <div id="application-form" className="py-12 md:py-20">
              <div className="section-container max-w-4xl">
                <div className="text-center mb-12">
                  <div className="mb-6 text-brand-primary flex justify-center">
                    <Store size={64} strokeWidth={1.5} />
                  </div>
                  <h2 className="font-title text-4xl md:text-6xl font-black mb-6 text-brand-header uppercase">
                    Vendor Application
                  </h2>
                  <p className="text-xl text-brand-text font-bold max-w-2xl mx-auto">
                    Join 30+ local vendors, food partners, and creative businesses at Atlanta's premier festival.
                  </p>
                </div>

                <div className="text-center">
                  <a
                    href="https://forms.gle/UcEf4GF1Hg4FaY8D9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-festival btn-lg inline-flex items-center gap-2"
                    onClick={() => gtag.trackVendorApplication()}
                  >
                    <Store size={20} />
                    Apply as a Vendor
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* DJ Form */}
          {activeTab === 'dj' && (
            <div id="application-form" className="py-12 md:py-20">
              <div className="section-container max-w-4xl">
                {/* DJ Info */}
                <div className="text-center mb-12">
                  <div className="mb-6 text-brand-primary flex justify-center">
                    <Music size={64} strokeWidth={1.5} />
                  </div>
                  <h2 className="font-title text-4xl md:text-6xl font-black mb-6 text-brand-header uppercase">
                    DJ Application
                  </h2>
                  <p className="text-xl text-brand-text font-bold max-w-2xl mx-auto">
                    We feature a variety of electronic music including house, bass, UKG, and DnB.
                  </p>
                </div>

                {/* Success/Error Messages */}
                {artistStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
                    <p className="text-green-800 font-semibold">
                      🎉 Thank you for your application! We'll review your music and be in touch soon.
                    </p>
                  </div>
                )}

                {artistStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg text-center">
                    <p className="text-red-800 font-semibold">
                      ❌ Oops! Something went wrong. Please try again.
                    </p>
                  </div>
                )}

                {/* DJ Form */}
                <div className="relative p-4 md:p-8 rounded-2xl overflow-hidden shadow-xl bg-white">
                  <div className="absolute inset-0"></div>
                  <form
                    ref={artistFormRef}
                    onSubmit={handleArtistSubmit}
                    className="relative z-10 space-y-6"
                  >
                    {/* Email */}
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
                        value={artistData.email}
                        onChange={handleArtistChange}
                        placeholder="your@email.com"
                        className="input input-bordered w-full focus:input-primary"
                        disabled={artistSubmitting}
                        required
                      />
                    </div>

                    {/* Full Legal Name */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          <User size={16} className="inline mr-2" />
                          Full legal name *
                        </span>
                      </label>
                      <input
                        type="text"
                        name="fullLegalName"
                        value={artistData.fullLegalName}
                        onChange={handleArtistChange}
                        placeholder="Your full legal name"
                        className="input input-bordered w-full focus:input-primary"
                        disabled={artistSubmitting}
                        required
                      />
                    </div>

                    {/* DJ Name / Alias */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          <Music size={16} className="inline mr-2" />
                          DJ Name / Alias *
                        </span>
                      </label>
                      <input
                        type="text"
                        name="djName"
                        value={artistData.djName}
                        onChange={handleArtistChange}
                        placeholder="Your DJ/Artist name"
                        className="input input-bordered w-full focus:input-primary"
                        disabled={artistSubmitting}
                        required
                      />
                    </div>

                    {/* City */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          <MapPin size={16} className="inline mr-2" />
                          What City are you Located? *
                        </span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={artistData.city}
                        onChange={handleArtistChange}
                        placeholder="City name"
                        className="input input-bordered w-full focus:input-primary"
                        disabled={artistSubmitting}
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          <Phone size={16} className="inline mr-2" />
                          Phone number *
                        </span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={artistData.phone}
                        onChange={handleArtistChange}
                        placeholder="(555) 123-4567"
                        className="input input-bordered w-full focus:input-primary"
                        disabled={artistSubmitting}
                        required
                      />
                    </div>

                    {/* Instagram Link */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          <LinkIcon size={16} className="inline mr-2" />
                          Instagram Link *
                        </span>
                      </label>
                      <input
                        type="url"
                        name="instagramLink"
                        value={artistData.instagramLink}
                        onChange={handleArtistChange}
                        placeholder="https://instagram.com/..."
                        className="input input-bordered w-full focus:input-primary"
                        disabled={artistSubmitting}
                        required
                      />
                    </div>

                    {/* Contact Method */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          <MessageSquare size={16} className="inline mr-2" />
                          What is the best way to contact you? *
                        </span>
                      </label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="contactMethod"
                            value="email"
                            checked={artistData.contactMethod === 'email'}
                            onChange={handleArtistChange}
                            className="radio radio-primary"
                            disabled={artistSubmitting}
                            required
                          />
                          <span className="text-brand-header">Email</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="contactMethod"
                            value="text"
                            checked={artistData.contactMethod === 'text'}
                            onChange={handleArtistChange}
                            className="radio radio-primary"
                            disabled={artistSubmitting}
                          />
                          <span className="text-brand-header">Text Message</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="contactMethod"
                            value="instagram"
                            checked={artistData.contactMethod === 'instagram'}
                            onChange={handleArtistChange}
                            className="radio radio-primary"
                            disabled={artistSubmitting}
                          />
                          <span className="text-brand-header">Instagram DM</span>
                        </div>
                      </div>
                    </div>

                    {/* Artist Bio */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          Tell us about you! What makes you stand out as an artist?
                        </span>
                      </label>
                      <textarea
                        name="artistBio"
                        value={artistData.artistBio}
                        onChange={handleArtistChange}
                        placeholder="Your answer"
                        rows={4}
                        className="textarea textarea-bordered w-full focus:textarea-primary"
                        disabled={artistSubmitting}
                      />
                    </div>

                    {/* B2B Favorite */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          Do you have a favorite DJ you like to B2B with? If so, who?
                        </span>
                      </label>
                      <textarea
                        name="b2bFavorite"
                        value={artistData.b2bFavorite}
                        onChange={handleArtistChange}
                        placeholder="Your answer"
                        rows={3}
                        className="textarea textarea-bordered w-full focus:textarea-primary"
                        disabled={artistSubmitting}
                      />
                    </div>

                    {/* Main Genre */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          What is your Main Genre? *
                        </span>
                      </label>
                      <select
                        name="mainGenre"
                        value={artistData.mainGenre}
                        onChange={handleArtistChange}
                        className="select select-bordered w-full focus:select-primary"
                        disabled={artistSubmitting}
                        required
                      >
                        <option value="">Choose</option>
                        <option value="House">House</option>
                        <option value="Afro House">Afro House</option>
                        <option value="Bass House">Bass House</option>
                        <option value="Tech House">Tech House</option>
                        <option value="Disco House">Disco House</option>
                        <option value="Progressive House">Progressive House</option>
                        <option value="Future House">Future House</option>
                        <option value="Big Room">Big Room</option>
                        <option value="Bass">Bass</option>
                        <option value="Dubstep">Dubstep</option>
                        <option value="Melodic Dubstep">Melodic Dubstep</option>
                        <option value="Riddim">Riddim</option>
                        <option value="Drum & Bass">Drum & Bass</option>
                        <option value="Jungle">Jungle</option>
                        <option value="Deep House">Deep House</option>
                        <option value="UK Garage">UK Garage</option>
                        <option value="Bassline">Bassline</option>
                        <option value="Techno">Techno</option>
                        <option value="Hardstyle">Hardstyle</option>
                        <option value="Brostep">Brostep</option>
                        <option value="Trap">Trap</option>
                        <option value="Future Bass">Future Bass</option>
                        <option value="Moombahton">Moombahton</option>
                        <option value="Open Format">Open Format</option>
                        <option value="Other (Please fill in below)">Other (Please fill in below)</option>
                      </select>
                    </div>

                    {/* Sub Genre */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          What is your Sub Genre? *
                        </span>
                      </label>
                      <select
                        name="subGenre"
                        value={artistData.subGenre}
                        onChange={handleArtistChange}
                        className="select select-bordered w-full focus:select-primary"
                        disabled={artistSubmitting}
                        required
                      >
                        <option value="">Choose</option>
                        <option value="House">House</option>
                        <option value="Afro House">Afro House</option>
                        <option value="Bass House">Bass House</option>
                        <option value="Tech House">Tech House</option>
                        <option value="Disco House">Disco House</option>
                        <option value="Progressive House">Progressive House</option>
                        <option value="Future House">Future House</option>
                        <option value="Big Room">Big Room</option>
                        <option value="Bass">Bass</option>
                        <option value="Dubstep">Dubstep</option>
                        <option value="Melodic Dubstep">Melodic Dubstep</option>
                        <option value="Riddim">Riddim</option>
                        <option value="Drum & Bass">Drum & Bass</option>
                        <option value="Jungle">Jungle</option>
                        <option value="Deep House">Deep House</option>
                        <option value="UK Garage">UK Garage</option>
                        <option value="Bassline">Bassline</option>
                        <option value="Techno">Techno</option>
                        <option value="Hardstyle">Hardstyle</option>
                        <option value="Brostep">Brostep</option>
                        <option value="Trap">Trap</option>
                        <option value="Future Bass">Future Bass</option>
                        <option value="Moombahton">Moombahton</option>
                        <option value="Open Format">Open Format</option>
                        <option value="Other (Please fill in below)">Other (Please fill in below)</option>
                      </select>
                    </div>

                    {/* Other Sub Genre */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          What is your other Sub Genre?
                        </span>
                      </label>
                      <select
                        name="otherSubGenre"
                        value={artistData.otherSubGenre}
                        onChange={handleArtistChange}
                        className="select select-bordered w-full focus:select-primary"
                        disabled={artistSubmitting}
                      >
                        <option value="">Choose</option>
                        <option value="House">House</option>
                        <option value="Afro House">Afro House</option>
                        <option value="Bass House">Bass House</option>
                        <option value="Tech House">Tech House</option>
                        <option value="Disco House">Disco House</option>
                        <option value="Progressive House">Progressive House</option>
                        <option value="Future House">Future House</option>
                        <option value="Big Room">Big Room</option>
                        <option value="Bass">Bass</option>
                        <option value="Dubstep">Dubstep</option>
                        <option value="Melodic Dubstep">Melodic Dubstep</option>
                        <option value="Riddim">Riddim</option>
                        <option value="Drum & Bass">Drum & Bass</option>
                        <option value="Jungle">Jungle</option>
                        <option value="Deep House">Deep House</option>
                        <option value="UK Garage">UK Garage</option>
                        <option value="Bassline">Bassline</option>
                        <option value="Techno">Techno</option>
                        <option value="Hardstyle">Hardstyle</option>
                        <option value="Brostep">Brostep</option>
                        <option value="Trap">Trap</option>
                        <option value="Future Bass">Future Bass</option>
                        <option value="Moombahton">Moombahton</option>
                        <option value="Open Format">Open Format</option>
                        <option value="Other (Please fill in below)">Other (Please fill in below)</option>
                      </select>
                    </div>

                    {/* Other Genre Text */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          Fill in your "Other" Genre Selections Here
                        </span>
                      </label>
                      <textarea
                        name="otherGenreText"
                        value={artistData.otherGenreText}
                        onChange={handleArtistChange}
                        placeholder="Your answer"
                        rows={3}
                        className="textarea textarea-bordered w-full focus:textarea-primary"
                        disabled={artistSubmitting}
                      />
                    </div>

                    {/* Live Performance Links */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          <LinkIcon size={16} className="inline mr-2" />
                          Links to any live performances
                        </span>
                      </label>
                      <textarea
                        name="livePerformanceLinks"
                        value={artistData.livePerformanceLinks}
                        onChange={handleArtistChange}
                        placeholder="Your answer"
                        rows={3}
                        className="textarea textarea-bordered w-full focus:textarea-primary"
                        disabled={artistSubmitting}
                      />
                    </div>

                    {/* Soundcloud Mix Link */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          <Headphones size={16} className="inline mr-2" />
                          Soundcloud Mix Link
                        </span>
                      </label>
                      <input
                        type="url"
                        name="soundcloudLink"
                        value={artistData.soundcloudLink}
                        onChange={handleArtistChange}
                        placeholder="Your answer"
                        className="input input-bordered w-full focus:input-primary"
                        disabled={artistSubmitting}
                      />
                    </div>

                    {/* Spotify Link */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          <Music size={16} className="inline mr-2" />
                          Spotify Link
                        </span>
                      </label>
                      <input
                        type="url"
                        name="spotifyLink"
                        value={artistData.spotifyLink}
                        onChange={handleArtistChange}
                        placeholder="Your answer"
                        className="input input-bordered w-full focus:input-primary"
                        disabled={artistSubmitting}
                      />
                    </div>

                    {/* Additional Information Section Header */}
                    <div className="pt-6 pb-2 border-t-2 border-brand-primary">
                      <h3 className="text-2xl font-bold text-brand-primary uppercase">Additional Information</h3>
                    </div>

                    {/* Rekordbox Familiar */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          Are you familiar with the USB export for XDJs / CDJs using Rekordbox? *
                        </span>
                      </label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="rekordboxFamiliar"
                            value="Yes"
                            checked={artistData.rekordboxFamiliar === 'Yes'}
                            onChange={handleArtistChange}
                            className="radio radio-primary"
                            disabled={artistSubmitting}
                            required
                          />
                          <span className="text-brand-header">Yes</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="rekordboxFamiliar"
                            value="No"
                            checked={artistData.rekordboxFamiliar === 'No'}
                            onChange={handleArtistChange}
                            className="radio radio-primary"
                            disabled={artistSubmitting}
                          />
                          <span className="text-brand-header">No</span>
                        </div>
                      </div>
                    </div>

                    {/* Promo Kit Links */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          <LinkIcon size={16} className="inline mr-2" />
                          Please link any promo and Press Kits
                        </span>
                      </label>
                      <textarea
                        name="promoKitLinks"
                        value={artistData.promoKitLinks}
                        onChange={handleArtistChange}
                        placeholder="Your answer"
                        rows={3}
                        className="textarea textarea-bordered w-full focus:textarea-primary"
                        disabled={artistSubmitting}
                      />
                    </div>

                    {/* Additional Info */}
                    <div className="form-control">
                      <label className="label flex-col items-start">
                        <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                          Anything else ya wanna add? 😊
                        </span>
                      </label>
                      <textarea
                        name="additionalInfo"
                        value={artistData.additionalInfo}
                        onChange={handleArtistChange}
                        placeholder="Your answer"
                        rows={4}
                        className="textarea textarea-bordered w-full focus:textarea-primary"
                        disabled={artistSubmitting}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={artistSubmitting}
                        className="btn-festival btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Music size={20} className="inline mr-2" />
                        {artistSubmitting ? 'Submitting...' : 'Submit DJ Application'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Contact CTA */}
        <section className="py-12 md:py-20 bg-brand-bg">
          <div className="section-container text-center">
            <h2 className="font-title text-4xl md:text-6xl font-black mb-6 text-brand-header uppercase">
              Questions?
            </h2>
            <p className="text-xl text-brand-text font-bold mb-8 max-w-2xl mx-auto">
              Have questions about participating? We'd love to hear from you.
            </p>
            <a href="/contact" className="btn-festival btn-lg inline-flex items-center gap-2">
              <Mail size={20} />
              Contact Us
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
