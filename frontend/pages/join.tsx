import { useState, useEffect } from 'react'
import SEO from '../components/shared/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { Mail } from 'lucide-react'
import JoinTabBar, { type JoinTab } from '../components/join/JoinTabBar'
import VolunteerSection from '../components/join/VolunteerSection'
import VendorSection from '../components/join/VendorSection'
import DJApplicationForm from '../components/join/DJApplicationForm'
import SponsorInquiryForm from '../components/shared/SponsorInquiryForm'

export default function JoinUs() {
  const [activeTab, setActiveTab] = useState<JoinTab>('dj')
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)

  useEffect(() => {
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsHeaderVisible(currentScrollY <= lastScrollY || currentScrollY <= 100)
      lastScrollY = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleTabSelect = (tab: JoinTab) => {
    setActiveTab(tab)
    setTimeout(() => {
      document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <>
      <SEO
        title="Join Us | Beats on the Block"
        description="Join Beats on the Block as a volunteer, vendor, or DJ. Be part of Atlanta's premier free outdoor electronic music experience."
        canonicalUrl="https://yourfestival.com/join"
      />

      <Header />

      <main className="pt-28 md:pt-[3.5rem]">
        <section className="relative overflow-hidden hero-gradient-gold">
          {/* Hero */}
          <div className="py-8">
            <div className="section-container relative z-10">
              <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black text-center mb-8 uppercase bg-gradient-to-r from-brand-pink via-brand-peach to-brand-primary bg-clip-text text-transparent">
                Join Us
              </h1>
              <div className="text-center mb-2">
                <p className="text-2xl md:text-3xl text-brand-text font-bold">
                  Be a part of the next Beats on the Block
                </p>
              </div>
            </div>
          </div>

          <JoinTabBar activeTab={activeTab} isHeaderVisible={isHeaderVisible} onTabSelect={handleTabSelect} />

          {activeTab === 'volunteer' && <VolunteerSection />}
          {activeTab === 'vendor' && <VendorSection />}
          {activeTab === 'dj' && <DJApplicationForm />}
          {activeTab === 'sponsor' && <SponsorInquiryForm />}
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
