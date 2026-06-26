/**
 * Structured Data (JSON-LD) schemas for SEO
 * https://schema.org/
 */

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://beatsontheblockfest.com/#org",
  "name": "Connect Atlanta",
  "legalName": "Connect Atlanta",
  "url": "https://beatsontheblockfest.com",
  "logo": "https://beatsontheblockfest.com/images/BOTB_White.png",
  "description": "Connect Atlanta produces Beats on the Block — Atlanta's premier free outdoor music festival on the BeltLine.",
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
    "https://www.instagram.com/connect__atlanta",
    "https://www.facebook.com/profile.php?id=61573559046886",
    "https://www.youtube.com/@Connect_Atlanta",
    "https://www.tiktok.com/@connect__atlanta"
  ],
  "foundingDate": "2024",
  "slogan": "Where music meets community on the Atlanta BeltLine"
}

export const eventSeriesSchema = {
  "@context": "https://schema.org",
  "@type": "EventSeries",
  "name": "Beats on the Block",
  "description": "Atlanta's premier FREE outdoor electronic music festival series. Experience world-class DJs, food vendors, and community vibes on the iconic Atlanta BeltLine.",
  "url": "https://beatsontheblockfest.com/events",
  "organizer": {
    "@id": "https://beatsontheblockfest.com/#org"
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
    "image": event.flyerUrl ? `https://beatsontheblockfest.com${event.flyerUrl}` : "https://beatsontheblockfest.com/images/events/september-2025.png",
    "organizer": {
      "@id": "https://beatsontheblockfest.com/#org"
    },
    "performer": event.artists ? {
      "@type": "PerformingGroup",
      "name": event.artists
    } : undefined,
    "offers": {
      "@type": "Offer",
      "url": "https://beatsontheblockfest.com/events",
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
    "item": `https://beatsontheblockfest.com${item.url}`
  }))
})

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Beats on the Block",
  "alternateName": "Connect Atlanta",
  "url": "https://beatsontheblockfest.com",
  "description": "Beats on the Block — Atlanta's premier free outdoor music festival, produced by Connect Atlanta.",
  "publisher": {
    "@id": "https://beatsontheblockfest.com/#org"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://beatsontheblockfest.com/events?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://beatsontheblockfest.com/#business",
  "name": "Connect Atlanta",
  "image": "https://beatsontheblockfest.com/images/BOTB_White.png",
  "url": "https://beatsontheblockfest.com",
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
  "description": "Connect Atlanta produces Beats on the Block, a free outdoor music festival series on the Atlanta BeltLine."
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
        "text": "DJs can apply through our website at beatsontheblockfest.com/join. We review all applications and select performers based on their experience, style, and fit with our community-focused events."
      }
    }
  ]
}
