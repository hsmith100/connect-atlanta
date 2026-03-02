// Google Analytics utility functions
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

// Check if GA is enabled
export const isGAEnabled = () => {
  return GA_TRACKING_ID && typeof window !== 'undefined'
}

// Page view tracking
export const pageview = (url) => {
  if (!isGAEnabled()) return
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  })
}

// Event tracking
export const event = ({ action, category, label, value }) => {
  if (!isGAEnabled()) return
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// Form submission tracking
export const trackFormSubmission = (formType) => {
  event({
    action: 'form_submission',
    category: 'Forms',
    label: formType,
  })
}

// Specific form trackers
export const trackDJApplication = () => {
  trackFormSubmission('DJ Application')
}

export const trackVendorApplication = () => {
  trackFormSubmission('Vendor Application')
}

export const trackVolunteerApplication = () => {
  trackFormSubmission('Volunteer Application')
}

export const trackEmailSignup = () => {
  trackFormSubmission('Email Signup')
}

export const trackContactForm = () => {
  trackFormSubmission('Contact Form')
}

// Track outbound links
export const trackOutboundLink = (url, label) => {
  event({
    action: 'click',
    category: 'Outbound Link',
    label: label || url,
  })
}

// Track social media clicks
export const trackSocialClick = (platform) => {
  event({
    action: 'click',
    category: 'Social Media',
    label: platform,
  })
}
