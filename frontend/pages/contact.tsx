import { useState, useRef } from 'react'
import SEO from '../components/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { Mail, MapPin, MessageSquare, User, Send, Phone } from 'lucide-react'
import * as gtag from '../lib/gtag'

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  marketingConsent: boolean;
}

export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null)
  const contactFormRef = useRef<HTMLDivElement>(null)

  // Contact form state
  const [contactData, setContactData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isContactSubmitting, setIsContactSubmitting] = useState(false)
  const [contactSubmitStatus, setContactSubmitStatus] = useState<'success' | 'error' | null>(null)

  // Signup form state
  const [signupData, setSignupData] = useState<SignupFormData>({
    name: '',
    email: '',
    phone: '',
    marketingConsent: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

  // Contact form handlers
  const handleContactInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactData(prev => ({
      ...prev,
      [name]: value
    } as ContactFormData))
  }

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsContactSubmitting(true)
    setContactSubmitStatus(null)

    try {
      const response = await fetch('/api/forms/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData)
      })

      if (response.ok) {
        setContactSubmitStatus('success')
        gtag.trackContactForm()
        if (contactFormRef.current) {
          contactFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        setTimeout(() => {
          setContactData({
            name: '',
            email: '',
            subject: '',
            message: ''
          })
          setContactSubmitStatus(null)
        }, 5000)
      } else {
        setContactSubmitStatus('error')
        if (contactFormRef.current) {
          contactFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setContactSubmitStatus('error')
      if (contactFormRef.current) {
        contactFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } finally {
      setIsContactSubmitting(false)
    }
  }

  // Signup form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setSignupData(prev => ({
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
          name: signupData.name,
          email: signupData.email,
          phone: signupData.phone,
          marketing_consent: signupData.marketingConsent,
          source: 'contact_page'
        })
      })

      if (response.ok) {
        setSubmitStatus('success')
        gtag.trackEmailSignup()
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        setTimeout(() => {
          setSignupData({
            name: '',
            email: '',
            phone: '',
            marketingConsent: false
          })
          setSubmitStatus(null)
        }, 3000)
      } else {
        setSubmitStatus('error')
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
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
        title="Contact Us | Beats on the Beltline"
        description="Get in touch with Beats on the Beltline. We'd love to hear from you about partnerships, performances, or general inquiries."
        canonicalUrl="https://yourfestival.com/contact"
      />

      <Header />

      <main className="pt-28 md:pt-[3.5rem]">
        {/* Hero + Contact Form Section Combined */}
        <section className="py-8 md:py-12 relative overflow-hidden hero-gradient-gold">
          <div className="section-container relative z-10">
            {/* Hero Title & Subtitle */}
            <div className="text-center mb-12">
              <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black mb-8 uppercase bg-gradient-to-r from-brand-pink via-brand-peach to-brand-primary bg-clip-text text-transparent">
                Contact Us
              </h1>
              <p className="text-2xl md:text-3xl text-brand-text font-bold max-w-4xl mx-auto">
                Let's connect and create something amazing together
              </p>
            </div>

            {/* Contact Form & Info Content */}
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">

              {/* Contact Form */}
              <div>
                <h2 className="font-title text-3xl md:text-5xl font-black mb-4 text-brand-header uppercase">
                  Send us a message
                </h2>
                <p className="text-lg text-brand-header/80 mb-8">
                  Have a question, idea, or just want to say hi? Fill out the form below and we'll get back to you as soon as possible.
                </p>

                {/* Success Message */}
                {contactSubmitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
                    <p className="text-green-800 font-semibold">
                      Message sent successfully! We'll get back to you soon.
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {contactSubmitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg text-center">
                    <p className="text-red-800 font-semibold">
                      Oops! Something went wrong. Please try again.
                    </p>
                  </div>
                )}

                <div ref={contactFormRef} className="relative p-8 rounded-2xl overflow-hidden shadow-xl bg-white">
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    {/* Name & Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold text-brand-header">
                            <User size={16} className="inline mr-2" />
                            Your Name *
                          </span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={contactData.name}
                          onChange={handleContactInputChange}
                          placeholder="Your name"
                          className="input input-bordered w-full focus:input-primary"
                          required
                          disabled={isContactSubmitting}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold text-brand-header">
                            <Mail size={16} className="inline mr-2" />
                            Email *
                          </span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={contactData.email}
                          onChange={handleContactInputChange}
                          placeholder="your@email.com"
                          className="input input-bordered w-full focus:input-primary"
                          required
                          disabled={isContactSubmitting}
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold text-brand-header">
                          Subject *
                        </span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={contactData.subject}
                        onChange={handleContactInputChange}
                        placeholder="What's this about?"
                        className="input input-bordered w-full focus:input-primary"
                        required
                        disabled={isContactSubmitting}
                      />
                    </div>

                    {/* Message */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold text-brand-header">
                          <MessageSquare size={16} className="inline mr-2" />
                          Message *
                        </span>
                      </label>
                      <textarea
                        name="message"
                        value={contactData.message}
                        onChange={handleContactInputChange}
                        className="textarea textarea-bordered h-40 focus:textarea-primary w-full"
                        placeholder="Tell us what's on your mind..."
                        required
                        disabled={isContactSubmitting}
                      ></textarea>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="btn-festival btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isContactSubmitting}
                      >
                        <Send size={20} className="inline mr-2" />
                        {isContactSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="font-title text-3xl md:text-5xl font-black mb-4 text-brand-header uppercase">
                  Get in touch
                </h2>
                <p className="text-lg text-brand-header/80 mb-8">
                  Prefer to reach out directly? Use any of the methods below.
                </p>

                {/* Contact Cards */}
                <div className="space-y-6">
                  {/* Email Card */}
                  <div className="card-bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-brand-primary/20">
                    <div className="mb-3 text-brand-primary">
                      <Mail size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-brand-header mb-2">Email</h3>
                    <a
                      href="mailto:info@connectevents.co"
                      className="text-brand-primary hover:text-brand-header transition-colors text-lg"
                    >
                      info@connectevents.co
                    </a>
                  </div>

                  {/* Location Card */}
                  <div className="card-bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-brand-primary/20">
                    <div className="mb-3 text-brand-primary">
                      <MapPin size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-brand-header mb-2">Location</h3>
                    <p className="text-brand-header/80 text-lg">
                      Atlanta, GA
                    </p>
                  </div>
                </div>

                {/* Social Media */}
                <div className="mt-8 p-6 card-bg-white rounded-2xl shadow-lg border-2 border-brand-primary/20">
                  <h3 className="text-xl font-bold text-brand-header mb-4">Follow Us</h3>
                  <div className="flex gap-4">
                    <a
                      href="https://www.instagram.com/connect__atlanta"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-circle btn-outline btn-primary hover:btn-primary"
                      aria-label="Instagram"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </a>
                    <a
                      href="https://www.facebook.com/profile.php?id=61573559046886"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-circle btn-outline btn-primary hover:btn-primary"
                      aria-label="Facebook"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </a>
                    <a
                      href="https://www.youtube.com/@Connect_Atlanta"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-circle btn-outline btn-primary hover:btn-primary"
                      aria-label="YouTube"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                      </svg>
                    </a>
                    <a
                      href="https://www.tiktok.com/@connect__atlanta"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-circle btn-outline btn-primary hover:btn-primary"
                      aria-label="TikTok"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>
          </div>
        </section>

        {/* Email/Phone Signup Section */}
        <section className="py-12 md:py-20 bg-brand-bg">
          <div className="section-container">
            <div className="max-w-2xl mx-auto text-center mb-8">
              <h2 className="font-title text-4xl md:text-5xl font-black mb-4 text-brand-header uppercase">
                Stay Connected
              </h2>
              <p className="text-lg text-brand-header/80">
                Sign up for text and email updates to get the latest event announcements, lineups, and exclusive content.
              </p>
            </div>

            {/* Success Message */}
            {submitStatus === 'success' && (
              <div className="max-w-2xl mx-auto mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
                <p className="text-green-800 font-semibold">
                  Thank you for signing up! We'll keep you updated on upcoming events.
                </p>
              </div>
            )}

            {/* Error Message */}
            {submitStatus === 'error' && (
              <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg text-center">
                <p className="text-red-800 font-semibold">
                  Oops! Something went wrong. Please try again.
                </p>
              </div>
            )}

            {/* Signup Form */}
            <div className="max-w-2xl mx-auto">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 card-bg-white border-2 border-brand-primary/20 rounded-2xl p-8 shadow-lg">
                {/* Name Field */}
                <div className="text-left">
                  <label htmlFor="signup-name" className="block text-brand-header font-semibold mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="signup-name"
                    name="name"
                    value={signupData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="input input-bordered w-full focus:input-primary"
                    placeholder="Your full name"
                  />
                </div>

                {/* Email Field */}
                <div className="text-left">
                  <label htmlFor="signup-email" className="block text-brand-header font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="signup-email"
                    name="email"
                    value={signupData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    className="input input-bordered w-full focus:input-primary"
                    placeholder="your.email@example.com"
                  />
                </div>

                {/* Phone Field */}
                <div className="text-left">
                  <label htmlFor="signup-phone" className="block text-brand-header font-semibold mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="signup-phone"
                    name="phone"
                    value={signupData.phone}
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
                    id="signup-marketing-consent"
                    name="marketingConsent"
                    checked={signupData.marketingConsent}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="checkbox checkbox-primary mt-1"
                  />
                  <label htmlFor="signup-marketing-consent" className="text-brand-header/80 text-sm leading-relaxed cursor-pointer">
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
                    {isSubmitting ? 'SIGNING UP...' : 'SIGN UP FOR UPDATES'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 md:py-20 bg-brand-bg">
          <div className="section-container max-w-4xl">
            <h2 className="font-title text-4xl md:text-6xl font-black text-center mb-4 text-brand-header uppercase">
              Quick Answers
            </h2>
            <p className="text-xl text-center text-brand-header/80 mb-12">
              Before reaching out, check if your question is answered here
            </p>

            <div className="space-y-4">
              {/* FAQ Items */}
              <div className="collapse collapse-plus bg-brand-bg border border-brand-primary/10">
                <input type="checkbox" defaultChecked />
                <div className="collapse-title text-xl font-bold text-brand-header">
                  How can I perform at Beats on the Beltline?
                </div>
                <div className="collapse-content text-brand-header/80">
                  <p>Head over to our <a href="/join" className="text-brand-primary hover:text-brand-header">Join Us page</a> and fill out the artist application form. We review all submissions and reach out to selected artists.</p>
                </div>
              </div>

              <div className="collapse collapse-plus bg-brand-bg border border-brand-primary/10">
                <input type="checkbox" defaultChecked />
                <div className="collapse-title text-xl font-bold text-brand-header">
                  How can I become a vendor?
                </div>
                <div className="collapse-content text-brand-header/80">
                  <p>Head over to our <a href="/join" className="text-brand-primary hover:text-brand-header">Join Us page</a> and fill out the vendor application form.</p>
                </div>
              </div>

              <div className="collapse collapse-plus bg-brand-bg border border-brand-primary/10">
                <input type="checkbox" defaultChecked />
                <div className="collapse-title text-xl font-bold text-brand-header">
                  Are you available for partnerships?
                </div>
                <div className="collapse-content text-brand-header/80">
                  <p>Yes! We are always open to new brand partnerships and sponsorship opportunities. Email us at <a href="mailto:info@connectevents.co" className="text-brand-primary hover:text-brand-header">info@connectevents.co</a> to discuss collaboration possibilities.</p>
                </div>
              </div>

              <div className="collapse collapse-plus bg-brand-bg border border-brand-primary/10">
                <input type="checkbox" defaultChecked />
                <div className="collapse-title text-xl font-bold text-brand-header">
                  When is the next event?
                </div>
                <div className="collapse-content text-brand-header/80">
                  <p>Check out our <a href="/events" className="text-brand-primary hover:text-brand-header">Events page</a> for upcoming dates, or sign up for our text and email updates to be the first to know about new event announcements.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
