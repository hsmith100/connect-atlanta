import SEO from '../components/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import ContactHero from '../components/contact/ContactHero'
import ContactForm from '../components/contact/ContactForm'
import ContactInfo from '../components/contact/ContactInfo'
import EmailSignupForm from '../components/contact/EmailSignupForm'
import ContactFAQ from '../components/contact/ContactFAQ'

export default function Contact() {
  return (
    <>
      <SEO
        title="Contact Us | Beats on the Beltline"
        description="Get in touch with Beats on the Beltline. We'd love to hear from you about partnerships, performances, or general inquiries."
        canonicalUrl="https://yourfestival.com/contact"
      />

      <Header />

      <main className="pt-28 md:pt-[3.5rem]">
        <section className="py-8 md:py-12 relative overflow-hidden hero-gradient-gold">
          <div className="section-container relative z-10">
            <ContactHero />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <ContactForm />
              <ContactInfo />
            </div>
          </div>
        </section>

        <EmailSignupForm />
        <ContactFAQ />
      </main>

      <Footer />
    </>
  )
}
