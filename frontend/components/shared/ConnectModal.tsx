import { useEffect, useState, useRef } from 'react'

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModalFormData {
  name: string;
  email: string;
  phone: string;
  marketingConsent: boolean;
}

export default function ConnectModal({ isOpen, onClose }: ConnectModalProps) {
    const formRef = useRef<HTMLFormElement>(null)
    const [formData, setFormData] = useState<ModalFormData>({
        name: '',
        email: '',
        phone: '',
        marketingConsent: false
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

    // Close modal on ESC key press
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                email: '',
                phone: '',
                marketingConsent: false
            })
            setSubmitStatus(null)
        }
    }, [isOpen])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        } as ModalFormData))
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
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || null,
                    marketing_consent: formData.marketingConsent,
                    source: 'website'
                })
            })

            if (response.ok) {
                setSubmitStatus('success')
                // Scroll to form top to show message
                if (formRef.current) {
                    formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                // Close modal after 2 seconds
                setTimeout(() => {
                    onClose()
                }, 2000)
            } else {
                const data = await response.json() as { error?: string }
                setSubmitStatus('error')
                console.error('Signup failed:', data)
                // Scroll to form top to show error
                if (formRef.current) {
                    formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error)
            setSubmitStatus('error')
            // Scroll to form top to show error
            if (formRef.current) {
                formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-brand-bg rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-brand-primary/20">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-brand-header hover:text-brand-primary transition-colors z-10"
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-8 h-8 stroke-current">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>

                {/* Modal Body */}
                <div className="p-8 md:p-12">
                    <h2 className="font-title text-4xl md:text-5xl font-black text-brand-primary mb-4 uppercase text-center flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
                        <span>Let's</span>
                        <img
                            src="/images/Justconnect.png"
                            alt="Connect"
                            className="h-7 md:h-9 w-auto"
                        />
                    </h2>

                    <p className="text-brand-header/80 text-center mb-8 max-w-xl mx-auto">
                        Join Atlanta's most vibrant music community. Stay updated on upcoming events, lineup announcements, and exclusive content.
                    </p>

                    {/* Success Message */}
                    {submitStatus === 'success' && (
                        <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
                            <p className="text-green-800 font-semibold">
                                🎉 Thank you for signing up! We'll keep you updated on upcoming events.
                            </p>
                        </div>
                    )}

                    {/* Error Message */}
                    {submitStatus === 'error' && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg text-center">
                            <p className="text-red-800 font-semibold">
                                ❌ Oops! Something went wrong. Please try again.
                            </p>
                        </div>
                    )}

                    {/* Connect Form */}
                    <form ref={formRef} className="space-y-6" onSubmit={handleSubmit}>
                        {/* Name Field */}
                        <div className="text-left">
                            <label htmlFor="modal-name" className="block text-brand-header font-semibold mb-2">
                                Name *
                            </label>
                            <input
                                type="text"
                                id="modal-name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitting}
                                className="input input-bordered w-full focus:input-primary"
                                placeholder="Your full name"
                            />
                        </div>

                        {/* Email Field */}
                        <div className="text-left">
                            <label htmlFor="modal-email" className="block text-brand-header font-semibold mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                id="modal-email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitting}
                                className="input input-bordered w-full focus:input-primary"
                                placeholder="your.email@example.com"
                            />
                        </div>

                        {/* Phone Field */}
                        <div className="text-left">
                            <label htmlFor="modal-phone" className="block text-brand-header font-semibold mb-2">
                                Phone Number <span className="text-sm text-brand-header/60">(Optional)</span>
                            </label>
                            <input
                                type="tel"
                                id="modal-phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                disabled={isSubmitting}
                                className="input input-bordered w-full focus:input-primary"
                                placeholder="(555) 123-4567"
                            />
                        </div>

                        {/* Marketing Consent Checkbox */}
                        <div className="text-left flex items-start gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="modal-marketing-consent"
                                name="marketingConsent"
                                checked={formData.marketingConsent}
                                onChange={handleInputChange}
                                disabled={isSubmitting}
                                className="checkbox checkbox-primary mt-1"
                            />
                            <label htmlFor="modal-marketing-consent" className="text-brand-header/80 text-sm leading-relaxed cursor-pointer">
                                I agree to receive marketing communications, event updates, and exclusive content from Beats on the Block. You can unsubscribe at any time.
                            </label>
                        </div>

                        {/* Submit Button */}
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
        </div>
    )
}
