import SEO from '../components/shared/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function CookiePolicy() {
  return (
    <>
      <SEO 
        title="Cookie Policy"
        description="Learn about how Connect Events uses cookies and similar technologies on our website."
        canonicalUrl="https://connectevents.co/cookie-policy"
      />
      
      <Header />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-12 bg-gradient-to-br from-white via-yellow-50 to-amber-100">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-primary via-purple-600 to-brand-secondary bg-clip-text text-transparent">
              Cookie Policy
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
              
              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">1. What Are Cookies?</h2>
              <p className="text-brand-text mb-4">
                Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. Cookies help websites remember information about your visit, making it easier to visit again and making the site more useful to you.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">2. How We Use Cookies</h2>
              <p className="text-brand-text mb-4">
                Connect Events uses cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our website</li>
                <li>Improve website performance and user experience</li>
                <li>Provide relevant content and features</li>
                <li>Analyze website traffic and usage patterns</li>
              </ul>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">3. Types of Cookies We Use</h2>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">3.1 Essential Cookies</h3>
              <p className="text-brand-text mb-4">
                These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas of the website. The website cannot function properly without these cookies.
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li><strong>Session cookies:</strong> Maintain your session as you navigate the site</li>
                <li><strong>Security cookies:</strong> Authenticate users and prevent fraudulent use</li>
              </ul>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">3.2 Performance Cookies</h3>
              <p className="text-brand-text mb-4">
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve how our website works.
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li><strong>Analytics cookies:</strong> Track page views, session duration, and bounce rates</li>
                <li><strong>Error tracking:</strong> Help us identify and fix technical issues</li>
              </ul>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">3.3 Functional Cookies</h3>
              <p className="text-brand-text mb-4">
                These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li><strong>Preference cookies:</strong> Remember your choices (like language or region)</li>
                <li><strong>Media cookies:</strong> Enable video and image content to display properly</li>
              </ul>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">4. Third-Party Cookies</h2>
              <p className="text-brand-text mb-4">
                In addition to our own cookies, we may use various third-party cookies to report usage statistics and deliver content:
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">4.1 Google Fonts</h3>
              <p className="text-brand-text mb-4">
                We use Google Fonts to display custom fonts on our website. Google may set cookies to track font usage and performance.
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">4.2 Cloudinary</h3>
              <p className="text-brand-text mb-4">
                We use Cloudinary to host and deliver images and media content. Cloudinary may set cookies to optimize content delivery.
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">4.3 Social Media</h3>
              <p className="text-brand-text mb-4">
                Our website includes social media features (like Instagram embeds). These services may set cookies to track your interactions.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">5. How Long Do Cookies Last?</h2>
              <p className="text-brand-text mb-4">
                The length of time a cookie stays on your device depends on its type:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent cookies:</strong> Remain on your device for a set period (from days to years)</li>
              </ul>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">6. Managing Cookies</h2>
              <p className="text-brand-text mb-4">
                You have the right to accept or reject cookies. Most web browsers automatically accept cookies, but you can modify your browser settings to decline cookies if you prefer.
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">6.1 Browser Settings</h3>
              <p className="text-brand-text mb-4">
                You can control cookies through your browser settings:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
              </ul>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">6.2 Effect of Disabling Cookies</h3>
              <p className="text-brand-text mb-4">
                If you disable cookies, some features of our website may not function properly. For example:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>You may need to re-enter information when visiting different pages</li>
                <li>Some interactive features may not work</li>
                <li>Videos and images may not load correctly</li>
              </ul>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">7. Do Not Track Signals</h2>
              <p className="text-brand-text mb-4">
                Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do not want to be tracked. Currently, there is no industry standard for how to respond to DNT signals. We do not currently respond to DNT signals, but we respect your privacy choices through browser cookie settings.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">8. Mobile Devices</h2>
              <p className="text-brand-text mb-4">
                Mobile devices may use technologies similar to cookies, such as:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li><strong>Device identifiers:</strong> Unique codes assigned to your device</li>
                <li><strong>Local storage:</strong> Data stored on your device by apps and websites</li>
              </ul>
              <p className="text-brand-text mb-4">
                You can manage these through your device settings.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">9. Updates to This Policy</h2>
              <p className="text-brand-text mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices or legal requirements. The updated version will be indicated by an updated "Last Updated" date at the top of this page.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">10. Your Consent</h2>
              <p className="text-brand-text mb-4">
                By using our website, you consent to our use of cookies as described in this Cookie Policy. If you do not agree to our use of cookies, you should set your browser settings accordingly or refrain from using our website.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">11. More Information</h2>
              <p className="text-brand-text mb-4">
                For more information about cookies, including how to see what cookies have been set and how to manage and delete them, visit:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li><a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:text-brand-secondary">allaboutcookies.org</a></li>
                <li><a href="https://www.youronlinechoices.eu" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:text-brand-secondary">youronlinechoices.eu</a></li>
              </ul>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">12. Contact Us</h2>
              <p className="text-brand-text mb-4">
                If you have questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <ul className="list-none text-brand-text mb-4 ml-4">
                <li><strong>Email:</strong> <a href="mailto:info@connectevents.co" className="text-brand-primary hover:text-brand-secondary">info@connectevents.co</a></li>
                <li><strong>Website:</strong> <a href="https://connectevents.co" className="text-brand-primary hover:text-brand-secondary">connectevents.co</a></li>
              </ul>

              <div className="mt-12 p-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-brand-primary/20">
                <p className="text-brand-text mb-2">
                  <strong>Related Policies:</strong>
                </p>
                <ul className="list-disc list-inside text-brand-text ml-4">
                  <li><a href="/privacy-policy" className="text-brand-primary hover:text-brand-secondary">Privacy Policy</a> - How we handle your personal information</li>
                  <li><a href="/terms-conditions" className="text-brand-primary hover:text-brand-secondary">Terms & Conditions</a> - Rules for using our website and services</li>
                </ul>
              </div>

            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  )
}
