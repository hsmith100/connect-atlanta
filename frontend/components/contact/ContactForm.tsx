import { useState, useRef } from 'react'
import { Mail, MessageSquare, User, Send } from 'lucide-react'
import * as gtag from '../../lib/gtag'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

const EMPTY_FORM: ContactFormData = { name: '', email: '', subject: '', message: '' }

export default function ContactForm() {
  const formRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState<ContactFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'success' | 'error' | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value } as ContactFormData))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch('/api/forms/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setStatus('success')
        gtag.trackContactForm()
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(() => {
          setFormData(EMPTY_FORM)
          setStatus(null)
        }, 5000)
      } else {
        setStatus('error')
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      setStatus('error')
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2 className="font-title text-3xl md:text-5xl font-black mb-4 text-brand-header uppercase">
        Send us a message
      </h2>
      <p className="text-lg text-brand-header/80 mb-8">
        Have a question, idea, or just want to say hi? Fill out the form below and we'll get back to you as soon as possible.
      </p>

      {status === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
          <p className="text-green-800 font-semibold">
            Message sent successfully! We'll get back to you soon.
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

      <div ref={formRef} className="relative p-8 rounded-2xl overflow-hidden shadow-xl bg-white">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-brand-header">
                  <User size={16} className="inline mr-2" />Your Name *
                </span>
              </label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="Your name" className="input input-bordered w-full focus:input-primary"
                required disabled={submitting} />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-brand-header">
                  <Mail size={16} className="inline mr-2" />Email *
                </span>
              </label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="your@email.com" className="input input-bordered w-full focus:input-primary"
                required disabled={submitting} />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-brand-header">Subject *</span>
            </label>
            <input type="text" name="subject" value={formData.subject} onChange={handleChange}
              placeholder="What's this about?" className="input input-bordered w-full focus:input-primary"
              required disabled={submitting} />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-brand-header">
                <MessageSquare size={16} className="inline mr-2" />Message *
              </span>
            </label>
            <textarea name="message" value={formData.message} onChange={handleChange}
              className="textarea textarea-bordered h-40 focus:textarea-primary w-full"
              placeholder="Tell us what's on your mind..." required disabled={submitting} />
          </div>

          <div className="pt-4">
            <button type="submit"
              className="btn-festival btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}>
              <Send size={20} className="inline mr-2" />
              {submitting ? 'SENDING...' : 'SEND MESSAGE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
