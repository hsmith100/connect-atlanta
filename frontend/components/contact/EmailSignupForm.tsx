import { useState, useRef } from 'react'
import * as gtag from '../../lib/gtag'

interface SignupFormData {
  name: string
  email: string
  phone: string
  marketingConsent: boolean
}

const EMPTY_FORM: SignupFormData = { name: '', email: '', phone: '', marketingConsent: false }

export default function EmailSignupForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState<SignupFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'success' | 'error' | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value } as SignupFormData))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch('/api/forms/email-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          marketing_consent: formData.marketingConsent,
          source: 'contact_page',
        }),
      })

      if (response.ok) {
        setStatus('success')
        gtag.trackEmailSignup()
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(() => {
          setFormData(EMPTY_FORM)
          setStatus(null)
        }, 3000)
      } else {
        setStatus('error')
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setStatus('error')
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
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

        {status === 'success' && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
            <p className="text-green-800 font-semibold">
              Thank you for signing up! We'll keep you updated on upcoming events.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg text-center">
            <p className="text-red-800 font-semibold">
              Oops! Something went wrong. Please try again.
            </p>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <form ref={formRef} onSubmit={handleSubmit}
            className="space-y-6 card-bg-white border-2 border-brand-primary/20 rounded-2xl p-8 shadow-lg">
            <div className="text-left">
              <label htmlFor="signup-name" className="block text-brand-header font-semibold mb-2">Name *</label>
              <input type="text" id="signup-name" name="name" value={formData.name} onChange={handleChange}
                required disabled={submitting}
                className="input input-bordered w-full focus:input-primary" placeholder="Your full name" />
            </div>

            <div className="text-left">
              <label htmlFor="signup-email" className="block text-brand-header font-semibold mb-2">Email *</label>
              <input type="email" id="signup-email" name="email" value={formData.email} onChange={handleChange}
                required disabled={submitting}
                className="input input-bordered w-full focus:input-primary" placeholder="your.email@example.com" />
            </div>

            <div className="text-left">
              <label htmlFor="signup-phone" className="block text-brand-header font-semibold mb-2">Phone Number *</label>
              <input type="tel" id="signup-phone" name="phone" value={formData.phone} onChange={handleChange}
                required disabled={submitting}
                className="input input-bordered w-full focus:input-primary" placeholder="(555) 123-4567" />
            </div>

            <div className="text-left flex items-start gap-3 pt-2">
              <input type="checkbox" id="signup-marketing-consent" name="marketingConsent"
                checked={formData.marketingConsent} onChange={handleChange}
                disabled={submitting} className="checkbox checkbox-primary mt-1" />
              <label htmlFor="signup-marketing-consent"
                className="text-brand-header/80 text-sm leading-relaxed cursor-pointer">
                I agree to receive marketing communications, event updates, and exclusive content from Beats on the Block. You can unsubscribe at any time.
              </label>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={submitting}
                className="btn-festival btn-lg w-full text-xl disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? 'SIGNING UP...' : 'SIGN UP FOR UPDATES'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
