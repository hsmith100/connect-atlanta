import { useState, useRef } from 'react'
import { Music, Mail, User, Phone, MapPin, Link as LinkIcon, MessageSquare, Headphones } from 'lucide-react'
import * as gtag from '../../lib/gtag'

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

const EMPTY_FORM: ArtistFormData = {
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
  additionalInfo: '',
}

const GENRE_OPTIONS = [
  'House', 'Afro House', 'Bass House', 'Tech House', 'Disco House',
  'Progressive House', 'Future House', 'Big Room', 'Bass', 'Dubstep',
  'Melodic Dubstep', 'Riddim', 'Drum & Bass', 'Jungle', 'Deep House',
  'UK Garage', 'Bassline', 'Techno', 'Hardstyle', 'Brostep', 'Trap',
  'Future Bass', 'Moombahton', 'Open Format', 'Other (Please fill in below)',
]

function GenreSelect({ name, value, onChange, disabled, required }: {
  name: string
  value: string
  onChange: React.ChangeEventHandler<HTMLSelectElement>
  disabled: boolean
  required?: boolean
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="select select-bordered w-full focus:select-primary"
      disabled={disabled}
      required={required}
    >
      <option value="">Choose</option>
      {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
    </select>
  )
}

export default function DJApplicationForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState<ArtistFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'success' | 'error' | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value } as ArtistFormData))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)

    try {
      const response = await fetch('/api/forms/artist-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          fullLegalName: formData.fullLegalName,
          djName: formData.djName,
          city: formData.city,
          phone: formData.phone,
          instagramLink: formData.instagramLink,
          contactMethod: formData.contactMethod,
          artistBio: formData.artistBio,
          b2bFavorite: formData.b2bFavorite,
          mainGenre: formData.mainGenre,
          subGenre: formData.subGenre,
          otherSubGenre: formData.otherSubGenre,
          otherGenreText: formData.otherGenreText || null,
          livePerformanceLinks: formData.livePerformanceLinks,
          soundcloudLink: formData.soundcloudLink || null,
          spotifyLink: formData.spotifyLink || null,
          rekordboxFamiliar: formData.rekordboxFamiliar,
          promoKitLinks: formData.promoKitLinks || null,
          additionalInfo: formData.additionalInfo || null,
        }),
      })

      if (response.ok) {
        setStatus('success')
        gtag.trackDJApplication()
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
            <Music size={64} strokeWidth={1.5} />
          </div>
          <h2 className="font-title text-4xl md:text-6xl font-black mb-6 text-brand-header uppercase">
            DJ Application
          </h2>
          <p className="text-xl text-brand-text font-bold max-w-2xl mx-auto">
            We feature a variety of electronic music.
          </p>
        </div>

        {status === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
            <p className="text-green-800 font-semibold">
              🎉 Thank you for your application! We'll review your music and be in touch soon.
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
          <div className="absolute inset-0"></div>
          <form ref={formRef} onSubmit={handleSubmit} className="relative z-10 space-y-6">

            {/* Email */}
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

            {/* Full Legal Name */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <User size={16} className="inline mr-2" />Full legal name *
                </span>
              </label>
              <input type="text" name="fullLegalName" value={formData.fullLegalName} onChange={handleChange}
                placeholder="Your full legal name" className="input input-bordered w-full focus:input-primary"
                disabled={submitting} required />
            </div>

            {/* DJ Name */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <Music size={16} className="inline mr-2" />DJ Name / Alias *
                </span>
              </label>
              <input type="text" name="djName" value={formData.djName} onChange={handleChange}
                placeholder="Your DJ/Artist name" className="input input-bordered w-full focus:input-primary"
                disabled={submitting} required />
            </div>

            {/* City */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <MapPin size={16} className="inline mr-2" />What City are you Located? *
                </span>
              </label>
              <input type="text" name="city" value={formData.city} onChange={handleChange}
                placeholder="City name" className="input input-bordered w-full focus:input-primary"
                disabled={submitting} required />
            </div>

            {/* Phone */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <Phone size={16} className="inline mr-2" />Phone number *
                </span>
              </label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                placeholder="(555) 123-4567" className="input input-bordered w-full focus:input-primary"
                disabled={submitting} required />
            </div>

            {/* Instagram */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <LinkIcon size={16} className="inline mr-2" />Instagram Link *
                </span>
              </label>
              <input type="url" name="instagramLink" value={formData.instagramLink} onChange={handleChange}
                placeholder="https://instagram.com/..." className="input input-bordered w-full focus:input-primary"
                disabled={submitting} required />
            </div>

            {/* Contact Method */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <MessageSquare size={16} className="inline mr-2" />What is the best way to contact you? *
                </span>
              </label>
              <div className="space-y-3 mt-2">
                {[
                  { value: 'email', label: 'Email' },
                  { value: 'text', label: 'Text Message' },
                  { value: 'instagram', label: 'Instagram DM' },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center gap-3">
                    <input type="radio" name="contactMethod" value={value}
                      checked={formData.contactMethod === value} onChange={handleChange}
                      className="radio radio-primary" disabled={submitting}
                      required={value === 'email'} />
                    <span className="text-brand-header">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Artist Bio */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  Tell us about you! What makes you stand out as an artist?
                </span>
              </label>
              <textarea name="artistBio" value={formData.artistBio} onChange={handleChange}
                placeholder="Your answer" rows={4}
                className="textarea textarea-bordered w-full focus:textarea-primary" disabled={submitting} />
            </div>

            {/* B2B Favorite */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  Do you have a favorite DJ you like to B2B with? If so, who?
                </span>
              </label>
              <textarea name="b2bFavorite" value={formData.b2bFavorite} onChange={handleChange}
                placeholder="Your answer" rows={3}
                className="textarea textarea-bordered w-full focus:textarea-primary" disabled={submitting} />
            </div>

            {/* Main Genre */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  What is your Main Genre? *
                </span>
              </label>
              <GenreSelect name="mainGenre" value={formData.mainGenre} onChange={handleChange} disabled={submitting} required />
            </div>

            {/* Sub Genre */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  What is your Sub Genre? *
                </span>
              </label>
              <GenreSelect name="subGenre" value={formData.subGenre} onChange={handleChange} disabled={submitting} required />
            </div>

            {/* Other Sub Genre */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  What is your other Sub Genre?
                </span>
              </label>
              <GenreSelect name="otherSubGenre" value={formData.otherSubGenre} onChange={handleChange} disabled={submitting} />
            </div>

            {/* Other Genre Text */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  Fill in your "Other" Genre Selections Here
                </span>
              </label>
              <textarea name="otherGenreText" value={formData.otherGenreText} onChange={handleChange}
                placeholder="Your answer" rows={3}
                className="textarea textarea-bordered w-full focus:textarea-primary" disabled={submitting} />
            </div>

            {/* Live Performance Links */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <LinkIcon size={16} className="inline mr-2" />Links to any live performances
                </span>
              </label>
              <textarea name="livePerformanceLinks" value={formData.livePerformanceLinks} onChange={handleChange}
                placeholder="Your answer" rows={3}
                className="textarea textarea-bordered w-full focus:textarea-primary" disabled={submitting} />
            </div>

            {/* Soundcloud */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <Headphones size={16} className="inline mr-2" />Soundcloud Mix Link
                </span>
              </label>
              <input type="url" name="soundcloudLink" value={formData.soundcloudLink} onChange={handleChange}
                placeholder="Your answer" className="input input-bordered w-full focus:input-primary"
                disabled={submitting} />
            </div>

            {/* Spotify */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <Music size={16} className="inline mr-2" />Spotify Link
                </span>
              </label>
              <input type="url" name="spotifyLink" value={formData.spotifyLink} onChange={handleChange}
                placeholder="Your answer" className="input input-bordered w-full focus:input-primary"
                disabled={submitting} />
            </div>

            {/* Additional Information Header */}
            <div className="pt-6 pb-2 border-t-2 border-brand-primary">
              <h3 className="text-2xl font-bold text-brand-primary uppercase">Additional Information</h3>
            </div>

            {/* Rekordbox */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  Are you familiar with the USB export for XDJs / CDJs using Rekordbox? *
                </span>
              </label>
              <div className="space-y-3 mt-2">
                {[
                  { value: 'Yes', label: 'Yes' },
                  { value: 'No', label: 'No' },
                ].map(({ value, label }) => (
                  <div key={value} className="flex items-center gap-3">
                    <input type="radio" name="rekordboxFamiliar" value={value}
                      checked={formData.rekordboxFamiliar === value} onChange={handleChange}
                      className="radio radio-primary" disabled={submitting}
                      required={value === 'Yes'} />
                    <span className="text-brand-header">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Promo Kit Links */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  <LinkIcon size={16} className="inline mr-2" />Please link any promo and Press Kits
                </span>
              </label>
              <textarea name="promoKitLinks" value={formData.promoKitLinks} onChange={handleChange}
                placeholder="Your answer" rows={3}
                className="textarea textarea-bordered w-full focus:textarea-primary" disabled={submitting} />
            </div>

            {/* Additional Info */}
            <div className="form-control">
              <label className="label flex-col items-start">
                <span className="label-text font-semibold text-brand-header text-sm md:text-base max-w-full break-words whitespace-normal">
                  Anything else ya wanna add? 😊
                </span>
              </label>
              <textarea name="additionalInfo" value={formData.additionalInfo} onChange={handleChange}
                placeholder="Your answer" rows={4}
                className="textarea textarea-bordered w-full focus:textarea-primary" disabled={submitting} />
            </div>

            {/* Submit */}
            <div className="pt-6">
              <button type="submit" disabled={submitting}
                className="btn-festival btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed">
                <Music size={20} className="inline mr-2" />
                {submitting ? 'Submitting...' : 'Submit DJ Application'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
