// EventStructuredData.js - Add this to pages that describe your festival event
// This helps Google understand your event and show it in special search results

export default function EventStructuredData({
  name = "Music Festival 2025",
  description = "Join us for an unforgettable music festival experience with top artists",
  startDate = "2025-07-15T10:00:00-05:00", // Format: ISO 8601
  endDate = "2025-07-17T23:00:00-05:00",
  locationName = "Festival Grounds",
  streetAddress = "123 Festival Road",
  addressLocality = "City Name",
  addressRegion = "State",
  postalCode = "12345",
  country = "US",
  ticketPrice = "150",
  ticketUrl = "http://localhost:3000/tickets",
  imageUrl = "http://localhost:3000/images/festival-image.jpg",
  performers = ["Artist Name 1", "Artist Name 2", "Artist Name 3"],
  organizerName = "Your Events Company",
  organizerUrl = "http://localhost:3000",
}) {
  const eventData = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    "name": name,
    "description": description,
    "startDate": startDate,
    "endDate": endDate,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": locationName,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": streetAddress,
        "addressLocality": addressLocality,
        "addressRegion": addressRegion,
        "postalCode": postalCode,
        "addressCountry": country
      }
    },
    "image": [imageUrl],
    "offers": {
      "@type": "Offer",
      "url": ticketUrl,
      "price": ticketPrice,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString()
    },
    "performer": performers.map(performer => ({
      "@type": "MusicGroup",
      "name": performer
    })),
    "organizer": {
      "@type": "Organization",
      "name": organizerName,
      "url": organizerUrl
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(eventData) }}
    />
  )
}

// Example usage in a page:
// 
// import Head from 'next/head'
// import EventStructuredData from '../components/EventStructuredData'
// 
// export default function HomePage() {
//   return (
//     <>
//       <Head>
//         <EventStructuredData 
//           name="Summer Music Fest 2025"
//           startDate="2025-07-15T10:00:00-05:00"
//           endDate="2025-07-17T23:00:00-05:00"
//           performers={["The Headliners", "Amazing Band", "DJ Superstar"]}
//         />
//       </Head>
//       <main>
//         {/* Your page content */}
//       </main>
//     </>
//   )
// }

