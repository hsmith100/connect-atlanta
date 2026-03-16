import SEO from '../components/shared/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function PrivacyPolicy() {
  return (
    <>
      <SEO 
        title="Privacy Policy"
        description="Connect Events privacy policy - How we collect, use, and protect your personal information."
        canonicalUrl="https://connectevents.co/privacy-policy"
      />
      
      <Header />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-12 bg-gradient-to-br from-white via-yellow-50 to-amber-100">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-primary via-purple-600 to-brand-secondary bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: January 22, 2026
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="prose prose-lg max-w-none">
              
              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">1. Introduction</h2>
              <p className="text-brand-text mb-4">
                Connect Events, Inc. ("we," "our," or "us") operates the website connectevents.co and produces the Beats on the Beltline event series. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or attend our events.
              </p>
              <p className="text-brand-text mb-4">
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">2.1 Personal Information You Provide</h3>
              <p className="text-brand-text mb-4">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Sign up for our email newsletter</li>
                <li>Apply to be a DJ, vendor, or volunteer</li>
                <li>Submit a contact form</li>
                <li>Interact with our social media</li>
              </ul>
              <p className="text-brand-text mb-4">
                This information may include:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Name (first and last)</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Business information (for vendors)</li>
                <li>Social media handles (for DJ applications)</li>
                <li>Any other information you choose to provide</li>
              </ul>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">2.2 Automatically Collected Information</h3>
              <p className="text-brand-text mb-4">
                When you visit our website, we may automatically collect certain information about your device, including:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website</li>
              </ul>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">3. How We Use Your Information</h2>
              <p className="text-brand-text mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Send event updates, newsletters, and promotional materials</li>
                <li>Process and respond to DJ, vendor, and volunteer applications</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Improve our website and event experiences</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraudulent activity and ensure security</li>
              </ul>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">4. How We Share Your Information</h2>
              <p className="text-brand-text mb-4">
                We may share your information in the following circumstances:
              </p>
              
              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">4.1 Service Providers</h3>
              <p className="text-brand-text mb-4">
                We use third-party service providers to help us operate our website and events:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li><strong>Amazon Web Services (AWS):</strong> For hosting, data storage, and email communications (including DynamoDB, S3, and Amazon SES)</li>
              </ul>
              <p className="text-brand-text mb-4">
                These service providers have access to your information only to perform specific tasks on our behalf and are obligated to protect your information.
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">4.2 Legal Requirements</h3>
              <p className="text-brand-text mb-4">
                We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">4.3 Business Transfers</h3>
              <p className="text-brand-text mb-4">
                If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">5. Data Retention</h2>
              <p className="text-brand-text mb-4">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law. Newsletter subscribers' information is retained until they unsubscribe.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">6. Your Privacy Rights</h2>
              <p className="text-brand-text mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
              </ul>
              <p className="text-brand-text mb-4">
                To exercise these rights, please contact us at <a href="mailto:info@connectevents.co" className="text-brand-primary hover:text-brand-secondary">info@connectevents.co</a>.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">7. Security</h2>
              <p className="text-brand-text mb-4">
                We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">8. Third-Party Websites</h2>
              <p className="text-brand-text mb-4">
                Our website may contain links to third-party websites (such as social media platforms). We are not responsible for the privacy practices of these websites. We encourage you to review their privacy policies.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">9. Children's Privacy</h2>
              <p className="text-brand-text mb-4">
                Our website and services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">10. California Privacy Rights</h2>
              <p className="text-brand-text mb-4">
                California residents have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, the right to delete personal information, and the right to opt-out of the sale of personal information. We do not sell personal information.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">11. International Data Transfers</h2>
              <p className="text-brand-text mb-4">
                Your information may be transferred to and processed in the United States or other countries where our service providers operate. By using our website, you consent to such transfers.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-brand-text mb-4">
                We may update this privacy policy from time to time. The updated version will be indicated by an updated "Last Updated" date. We encourage you to review this privacy policy periodically.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">13. Contact Us</h2>
              <p className="text-brand-text mb-4">
                If you have questions or concerns about this privacy policy or our data practices, please contact us:
              </p>
              <ul className="list-none text-brand-text mb-4 ml-4">
                <li><strong>Email:</strong> <a href="mailto:info@connectevents.co" className="text-brand-primary hover:text-brand-secondary">info@connectevents.co</a></li>
                <li><strong>Website:</strong> <a href="https://connectevents.co" className="text-brand-primary hover:text-brand-secondary">connectevents.co</a></li>
                <li><strong>Business Name:</strong> Connect Events, Inc.</li>
                <li><strong>Location:</strong> Atlanta, Georgia, USA</li>
              </ul>

            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  )
}
