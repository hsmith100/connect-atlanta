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
        description="Learn about Beats on the Block, produced by Connect Atlanta — Atlanta's premier free outdoor music festival. Discover our mission and story."
        canonicalUrl="https://beatsontheblockfest.com/about"
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
