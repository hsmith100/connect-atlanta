import SEO from '../components/shared/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import AboutHero from '../components/about/AboutHero'
import WhatWeBring from '../components/about/WhatWeBring'
import JoinMovementCTA from '../components/about/JoinMovementCTA'

export default function About() {
  return (
    <>
      <SEO
        title="About Us | Beats on the Block"
        description="Learn about Atlanta's premier free outdoor electronic music experience. Discover our mission, vision, and the story behind Beats on the Block."
        canonicalUrl="https://yourfestival.com/about"
      />

      <Header />

      <main className="pt-28 md:pt-[3.5rem]">
        <AboutHero />
        <WhatWeBring />
        <JoinMovementCTA />
      </main>

      <Footer />
    </>
  )
}
