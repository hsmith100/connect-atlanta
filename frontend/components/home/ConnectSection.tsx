import { useState, useRef } from 'react'

interface SignupFormData {
  name: string
  email: string
  phone: string
  marketingConsent: boolean
}

const EMPTY_FORM: SignupFormData = { name: '', email: '', phone: '', marketingConsent: false }

export default function ConnectSection() {
  const formRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState<SignupFormData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value } as SignupFormData))
  }

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch('/api/forms/email-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          marketing_consent: formData.marketingConsent,
          source: 'website',
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        scrollToForm()
        setTimeout(() => {
          setFormData(EMPTY_FORM)
          setSubmitStatus(null)
        }, 3000)
      } else {
        const data = await response.json() as { error?: string }
        console.error('Signup failed:', data)
        setSubmitStatus('error')
        scrollToForm()
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
      scrollToForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="join" className="py-6 md:py-10 bg-brand-bg">
      <div className="section-container text-center">
        <h2 className="font-title text-5xl md:text-7xl font-black mb-8 text-brand-header uppercase flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
          <span>Let's</span>
          <img src="/images/Justconnect.png" alt="Connect" className="h-10 md:h-14 w-auto" />
        </h2>

        <div className="max-w-3xl mx-auto space-y-6 mb-12">
          <p className="text-xl leading-relaxed text-brand-header">
            Be part of Atlanta's most vibrant music community. Whether you're a DJ, artist, vendor, or music lover, there's a place for you at Beats on the Block.
          </p>
          <p className="text-lg leading-relaxed text-brand-header/70">
            Stay updated on upcoming events, lineup announcements, giveaways, and exclusive content.
          </p>
        </div>

        {submitStatus === 'success' && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
            <p className="text-green-800 font-semibold">
              🎉 Thank you for signing up! We'll keep you updated on upcoming events.
            </p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg text-center">
            <p className="text-red-800 font-semibold">
              ❌ Oops! Something went wrong. Please try again.
            </p>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 card-bg-white border-2 border-brand-primary/20 rounded-2xl p-8 shadow-lg">
            <div className="text-left">
              <label htmlFor="name" className="block text-brand-header font-semibold mb-2">Name *</label>
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

            <div className="text-left">
              <label htmlFor="email" className="block text-brand-header font-semibold mb-2">Email *</label>
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

            <div className="text-left">
              <label htmlFor="phone" className="block text-brand-header font-semibold mb-2">Phone Number *</label>
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
                I agree to receive marketing communications, event updates, and exclusive content from Beats on the Block. You can unsubscribe at any time.
              </label>
            </div>

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
  )
}
