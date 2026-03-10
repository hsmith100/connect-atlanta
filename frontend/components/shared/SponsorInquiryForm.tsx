import { useState, useRef } from 'react'
import { Mail, User, Phone, Building2, Briefcase } from 'lucide-react'
import * as gtag from '../../lib/gtag'

interface SponsorFormData {
  name: string
  email: string
  phone: string
  company: string
  productIndustry: string
}

const EMPTY_FORM: SponsorFormData = { name: '', email: '', phone: '', company: '', productIndustry: '' }

function FormField({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="form-control">
      <label className="label flex-col items-start">
        <span className="label-text font-semibold text-brand-header text-sm md:text-base">{label}</span>
      </label>
      {children}
    </div>
  )
}

export default function SponsorInquiryForm() {
  const formRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState<SponsorFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'success' | 'error' | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value } as SponsorFormData))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch('/api/forms/sponsor-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setStatus('success')
        gtag.trackFormSubmission('Sponsor Inquiry')
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setFormData(EMPTY_FORM)
        setTimeout(() => setStatus(null), 5000)
      } else {
        setStatus('error')
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } catch (error) {
      console.error('Error:', error)
      setStatus('error')
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-brand-bg py-12 md:py-20">
      <div className="section-container max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-title text-4xl md:text-6xl font-black mb-6 text-brand-header uppercase">
            Let's work together
          </h2>
          <p className="text-xl text-brand-text font-bold max-w-2xl mx-auto">
            Interested in being a Sponsor for 2026 BOTB? Please fill out the form below and a team member will reach out!
          </p>
        </div>

        <div ref={formRef}>
          {status === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
              <p className="text-green-800 font-semibold">
                🎉 Thank you for your interest! A team member will reach out to you soon.
              </p>
            </div>
          )}
          {status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg text-center">
              <p className="text-red-800 font-semibold">
                ❌ Oops! Something went wrong. Please try again.
              </p>
            </div>
          )}

          <div className="relative p-4 md:p-8 rounded-2xl overflow-hidden shadow-xl bg-white">
            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
              <FormField label={<><User size={16} className="inline mr-2" />Name *</>}>
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="Your full name" className="input input-bordered w-full focus:input-primary"
                  disabled={submitting} required />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label={<><Mail size={16} className="inline mr-2" />Email *</>}>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="your@email.com" className="input input-bordered w-full focus:input-primary"
                    disabled={submitting} required />
                </FormField>
                <FormField label={<><Phone size={16} className="inline mr-2" />Phone Number *</>}>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="(555) 123-4567" className="input input-bordered w-full focus:input-primary"
                    disabled={submitting} required />
                </FormField>
              </div>

              <FormField label={<><Building2 size={16} className="inline mr-2" />Company *</>}>
                <input type="text" name="company" value={formData.company} onChange={handleChange}
                  placeholder="Your company name" className="input input-bordered w-full focus:input-primary"
                  disabled={submitting} required />
              </FormField>

              <FormField label={<><Briefcase size={16} className="inline mr-2" />Product/Industry *</>}>
                <textarea name="productIndustry" value={formData.productIndustry} onChange={handleChange}
                  className="textarea textarea-bordered h-24 focus:textarea-primary w-full"
                  placeholder="Tell us about your product or industry..."
                  disabled={submitting} required />
              </FormField>

              <div className="pt-6">
                <button type="submit" disabled={submitting}
                  className="btn-festival btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed">
                  <Briefcase size={20} className="inline mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
