import { useState, useRef } from 'react'
import { Building2, Mail, User, Phone, FileText } from 'lucide-react'

interface SponsorFormData {
  name: string
  company: string
  email: string
  phone: string
  productIndustry: string
}

const EMPTY_FORM: SponsorFormData = {
  name: '',
  company: '',
  email: '',
  phone: '',
  productIndustry: '',
}

export default function SponsorInquiryForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState<SponsorFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'success' | 'error' | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setFormData(EMPTY_FORM)
        setTimeout(() => setStatus(null), 5000)
      } else {
        setStatus('error')
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (error) {
      console.error('Error:', error)
      setStatus('error')
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div id="application-form" className="py-12 md:py-20">
      <div className="section-container max-w-4xl">
        <div className="text-center mb-12">
          <div className="mb-6 text-brand-primary flex justify-center">
            <Building2 size={64} strokeWidth={1.5} />
          </div>
          <h2 className="font-title text-4xl md:text-6xl font-black mb-6 text-brand-header uppercase">
            Become a Sponsor
          </h2>
          <p className="text-xl text-brand-text font-bold max-w-2xl mx-auto">
            Partner with Beats on the Beltline and connect your brand with Atlanta's vibrant festival community.
          </p>
        </div>

        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
            <p className="text-green-800 font-semibold">
              Thank you for your interest in sponsoring! A team member will reach out to you soon.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg text-center">
            <p className="text-red-800 font-semibold">
              Oops! Something went wrong. Please try again.
            </p>
          </div>
        )}

        <div className="relative p-4 md:p-8 rounded-2xl overflow-hidden shadow-xl bg-white">
          <div className="absolute inset-0"></div>
          <form ref={formRef} onSubmit={handleSubmit} className="relative z-10 space-y-6">

            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <User size={16} className="inline mr-2" />Name *
                </span>
              </label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="Your full name" className="input input-bordered w-full focus:input-primary"
                disabled={submitting} required />
            </div>

            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <Building2 size={16} className="inline mr-2" />Company *
                </span>
              </label>
              <input type="text" name="company" value={formData.company} onChange={handleChange}
                placeholder="Your company name" className="input input-bordered w-full focus:input-primary"
                disabled={submitting} required />
            </div>

            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <Mail size={16} className="inline mr-2" />Email *
                </span>
              </label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="your@email.com" className="input input-bordered w-full focus:input-primary"
                disabled={submitting} required />
            </div>

            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <Phone size={16} className="inline mr-2" />Phone *
                </span>
              </label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                placeholder="(555) 123-4567" className="input input-bordered w-full focus:input-primary"
                disabled={submitting} required />
            </div>

            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <FileText size={16} className="inline mr-2" />Product / Industry *
                </span>
                <span className="label-text-alt text-brand-text/60 mt-1">
                  Tell us about your product or industry and what you're looking to get out of a sponsorship.
                </span>
              </label>
              <textarea name="productIndustry" value={formData.productIndustry} onChange={handleChange}
                placeholder="Describe your product or industry and sponsorship goals"
                rows={5} className="textarea textarea-bordered w-full focus:textarea-primary"
                disabled={submitting} required />
            </div>

            <div className="pt-6">
              <button type="submit" disabled={submitting}
                className="btn-festival btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed">
                <Building2 size={20} className="inline mr-2" />
                {submitting ? 'Submitting...' : 'Submit Sponsor Inquiry'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
