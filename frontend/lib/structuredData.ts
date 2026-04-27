/**
 * Structured Data (JSON-LD) schemas for SEO
 * https://schema.org/
 */

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Connect Events",
  "legalName": "Connect Events, Inc.",
  "url": "https://connectevents.co",
  "logo": "https://connectevents.co/images/ConnectLogoBIG-Black.svg",
  "description": "Atlanta's premier FREE outdoor electronic music festival producer. We create unforgettable daytime experiences on the Atlanta BeltLine through our Beats on the Block event series.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Atlanta",
    "addressRegion": "GA",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "33.7490",
    "longitude": "-84.3880"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "info@connectevents.co",
    "contactType": "Customer Service",
    "areaServed": "US"
  },
  "sameAs": [
    "https://www.instagram.com/connecteventsatl/",
    "https://www.facebook.com/connecteventsatl/"
  ],
  "foundingDate": "2024",
  "slogan": "Where music meets community on the Atlanta BeltLine"
}

export const eventSeriesSchema = {
  "@context": "https://schema.org",
  "@type": "EventSeries",
  "name": "Beats on the Block",
  "description": "Atlanta's premier FREE outdoor electronic music festival series. Experience world-class DJs, food vendors, and community vibes on the iconic Atlanta BeltLine.",
  "url": "https://connectevents.co/events",
  "organizer": {
    "@type": "Organization",
    "name": "Connect Events",
    "url": "https://connectevents.co"
  },
  "location": {
    "@type": "Place",
    "name": "Atlanta BeltLine",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Atlanta",
      "addressRegion": "GA",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "33.7490",
      "longitude": "-84.3880"
    }
  },
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "eventStatus": "https://schema.org/EventScheduled",
  "isAccessibleForFree": true,
  "audience": {
    "@type": "Audience",
    "audienceType": "Music Lovers, EDM Fans, Atlanta Community"
  }
}

interface StructuredDataEvent {
  title: string;
  date: string;
  flyerUrl?: string | null;
  artists?: string | null;
  description?: string;
  endDate?: string;
  location?: string;
}

export function createEventSchema(event: StructuredDataEvent): object {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    "name": event.title,
    "description": event.description || `Join us for ${event.title} - part of the Beats on the Block series featuring world-class DJs and amazing vibes on the Atlanta BeltLine.`,
    "startDate": event.date,
    "endDate": event.endDate || event.date,
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": event.location || "Atlanta BeltLine",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Atlanta",
        "addressRegion": "GA",
        "addressCountry": "US"
      }
    },
    "image": event.flyerUrl ? `https://connectevents.co${event.flyerUrl}` : "https://connectevents.co/images/events/september-2025.png",
    "organizer": {
      "@type": "Organization",
      "name": "Connect Events",
      "url": "https://connectevents.co"
    },
    "performer": event.artists ? {
      "@type": "PerformingGroup",
      "name": event.artists
    } : undefined,
    "offers": {
      "@type": "Offer",
      "url": "https://connectevents.co/events",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "validFrom": event.date
    },
    "isAccessibleForFree": true,
    "audience": {
      "@type": "Audience",
      "audienceType": "All Ages (under 18 must be accompanied by guardian)"
    }
  }
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export const breadcrumbSchema = (items: BreadcrumbItem[]): object => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": `https://connectevents.co${item.url}`
  }))
})

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Connect Events",
  "alternateName": "Beats on the Block",
  "url": "https://connectevents.co",
  "description": "Atlanta's premier FREE outdoor electronic music festival",
  "publisher": {
    "@type": "Organization",
    "name": "Connect Events, Inc.",
    "logo": {
      "@type": "ImageObject",
      "url": "https://connectevents.co/images/ConnectLogoBIG-Black.svg"
    }
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://connectevents.co/events?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "sameAs": [
    "https://www.instagram.com/connecteventsatl/",
    "https://www.facebook.com/connecteventsatl/"
  ]
}

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://connectevents.co/#business",
  "name": "Connect Events",
  "image": "https://connectevents.co/images/ConnectLogoBIG-Black.svg",
  "url": "https://connectevents.co",
  "telephone": "",
  "email": "info@connectevents.co",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Atlanta",
    "addressRegion": "GA",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "33.7490",
    "longitude": "-84.3880"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "opens": "09:00",
    "closes": "17:00"
  },
  "priceRange": "Free Events",
  "paymentAccepted": "N/A",
  "description": "Event production company specializing in FREE outdoor electronic music festivals in Atlanta"
}

// FAQ Schema for common questions
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is Beats on the Block free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Beats on the Block is completely FREE to attend. It's a community event on the public Atlanta BeltLine with no tickets or admission fees required."
      }
    },
    {
      "@type": "Question",
      "name": "Where is Beats on the Block located?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Beats on the Block takes place on the Atlanta BeltLine in various locations around Atlanta, Georgia. Specific locations are announced for each event."
      }
    },
    {
      "@type": "Question",
      "name": "What kind of music is played at Beats on the Block?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We feature electronic dance music (EDM) including house, techno, deep house, and more. Our events showcase both established and up-and-coming DJs from the Atlanta electronic music scene."
      }
    },
    {
      "@type": "Question",
      "name": "Can I bring my kids to Beats on the Block?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! The event is all ages. However, attendees under 18 must be accompanied by a parent or legal guardian."
      }
    },
    {
      "@type": "Question",
      "name": "How do I apply to DJ at Beats on the Block?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "DJs can apply through our website at connectevents.co/join. We review all applications and select performers based on their experience, style, and fit with our community-focused events."
      }
    }
  ]
}
