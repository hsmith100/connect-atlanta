// Google Analytics utility functions

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

// Check if GA is enabled
export const isGAEnabled = (): boolean => {
  return !!(GA_TRACKING_ID && typeof window !== 'undefined')
}

// Page view tracking
export const pageview = (url: string): void => {
  if (!isGAEnabled()) return
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  })
}

interface GTagEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// Event tracking
export const event = ({ action, category, label, value }: GTagEvent): void => {
  if (!isGAEnabled()) return
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// Form submission tracking
export const trackFormSubmission = (formType: string): void => {
  event({
    action: 'form_submission',
    category: 'Forms',
    label: formType,
  })
}

// Specific form trackers
export const trackDJApplication = (): void => {
  trackFormSubmission('DJ Application')
}

export const trackVendorApplication = (): void => {
  trackFormSubmission('Vendor Application')
}

export const trackVolunteerApplication = (): void => {
  trackFormSubmission('Volunteer Application')
}

export const trackEmailSignup = (): void => {
  trackFormSubmission('Email Signup')
}

export const trackContactForm = (): void => {
  trackFormSubmission('Contact Form')
}

// Track outbound links
export const trackOutboundLink = (url: string, label?: string): void => {
  event({
    action: 'click',
    category: 'Outbound Link',
    label: label || url,
  })
}

// Track social media clicks
export const trackSocialClick = (platform: string): void => {
  event({
    action: 'click',
    category: 'Social Media',
    label: platform,
  })
}
