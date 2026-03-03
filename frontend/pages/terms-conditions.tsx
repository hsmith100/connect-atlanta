import SEO from '../components/SEO'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function TermsConditions() {
  return (
    <>
      <SEO 
        title="Terms & Conditions"
        description="Terms and conditions for using the Connect Events website and attending Beats on the Beltline events."
        canonicalUrl="https://connectevents.co/terms-conditions"
      />
      
      <Header />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-12 bg-gradient-to-br from-white via-yellow-50 to-amber-100">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-primary via-purple-600 to-brand-secondary bg-clip-text text-transparent">
              Terms & Conditions
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
              
              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">1. Agreement to Terms</h2>
              <p className="text-brand-text mb-4">
                By accessing or using the website connectevents.co ("Website") or attending Beats on the Beltline events ("Events") operated by Connect Events, Inc. ("we," "our," or "us"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use our Website or attend our Events.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">2. Website Use</h2>
              
              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">2.1 Eligibility</h3>
              <p className="text-brand-text mb-4">
                You must be at least 18 years old to use this Website and submit applications. By using this Website, you represent that you meet this age requirement.
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">2.2 Acceptable Use</h3>
              <p className="text-brand-text mb-4">
                You agree to use the Website only for lawful purposes. You must not:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Impersonate any person or entity</li>
                <li>Submit false or misleading information</li>
                <li>Interfere with the Website's operation or security</li>
                <li>Attempt to gain unauthorized access to any part of the Website</li>
                <li>Use automated systems (bots, scrapers) without permission</li>
                <li>Upload viruses, malware, or harmful code</li>
              </ul>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">3. Event Attendance</h2>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">3.1 General Admission</h3>
              <p className="text-brand-text mb-4">
                Beats on the Beltline is a FREE public event held on the Atlanta BeltLine. Attendance is open to all ages, but attendees under 18 must be accompanied by a parent or legal guardian.
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">3.2 Assumption of Risk</h3>
              <p className="text-brand-text mb-4">
                By attending our Events, you acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Events are held outdoors and are subject to weather conditions</li>
                <li>You assume all risks associated with attendance, including but not limited to: weather exposure, crowd-related incidents, trip hazards, and illness</li>
                <li>You participate in activities at your own risk</li>
                <li>We are not responsible for personal injury, illness, or property damage</li>
              </ul>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">3.3 Code of Conduct</h3>
              <p className="text-brand-text mb-4">
                All attendees must:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Respect other attendees, staff, performers, and vendors</li>
                <li>Follow all venue rules and instructions from event staff</li>
                <li>Not engage in violent, threatening, or disruptive behavior</li>
                <li>Comply with all applicable laws, including alcohol and drug laws</li>
                <li>Not bring prohibited items (weapons, illegal substances, etc.)</li>
              </ul>
              <p className="text-brand-text mb-4">
                We reserve the right to remove any attendee who violates these rules without refund or compensation.
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">3.4 Photography and Recording</h3>
              <p className="text-brand-text mb-4">
                By attending our Events, you grant us permission to photograph, film, and record your image, likeness, and voice for promotional and marketing purposes. These materials may be used on our website, social media, and promotional materials without compensation to you.
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">3.5 Event Changes and Cancellations</h3>
              <p className="text-brand-text mb-4">
                We reserve the right to:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Modify event details (date, time, location, lineup)</li>
                <li>Cancel or postpone events due to weather, safety concerns, or other circumstances</li>
                <li>Refuse entry to any individual</li>
              </ul>
              <p className="text-brand-text mb-4">
                As this is a free event, no refunds or compensation will be provided for changes or cancellations.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">4. Applications (DJ, Vendor, Volunteer)</h2>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">4.1 Application Process</h3>
              <p className="text-brand-text mb-4">
                Applications submitted through our Website are not binding contracts. We review all applications and make selections at our sole discretion. Submission of an application does not guarantee acceptance or participation.
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">4.2 DJ Applications</h3>
              <p className="text-brand-text mb-4">
                By submitting a DJ application, you:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Confirm you have the legal right to perform the music you play</li>
                <li>Agree to provide your own equipment unless otherwise arranged</li>
                <li>Understand that performance slots are limited and not guaranteed</li>
                <li>Agree to adhere to event guidelines, set times, and content standards</li>
                <li>Acknowledge that performances are unpaid (this is a community event)</li>
              </ul>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">4.3 Vendor Applications</h3>
              <p className="text-brand-text mb-4">
                Vendors must:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Possess all required business licenses and permits</li>
                <li>Comply with all health and safety regulations</li>
                <li>Provide proof of insurance if required</li>
                <li>Follow all venue rules and event guidelines</li>
                <li>Not sublet or transfer their assigned space</li>
              </ul>
              <p className="text-brand-text mb-4">
                Vendor fees, if applicable, will be communicated separately and must be paid before event participation.
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">4.4 Volunteer Applications</h3>
              <p className="text-brand-text mb-4">
                Volunteers:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Must be at least 18 years old</li>
                <li>Agree to follow all instructions from event coordinators</li>
                <li>Understand that volunteer positions are unpaid</li>
                <li>May be required to sign additional waivers or agreements</li>
              </ul>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">5. Intellectual Property</h2>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">5.1 Our Content</h3>
              <p className="text-brand-text mb-4">
                All content on this Website, including text, graphics, logos, images, videos, and software, is the property of Connect Events, Inc. or its content suppliers and is protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-brand-text mb-4">
                You may not:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Reproduce, distribute, or create derivative works without permission</li>
                <li>Remove copyright or other proprietary notices</li>
                <li>Use our trademarks or branding without authorization</li>
              </ul>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">5.2 User-Generated Content</h3>
              <p className="text-brand-text mb-4">
                By submitting content to us (applications, photos, feedback), you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and display that content for event promotion and operations.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">6. Third-Party Services</h2>
              <p className="text-brand-text mb-4">
                Our Website uses third-party services (Google Sheets, Cloudinary, SendGrid) to process and store information. While we choose reputable providers, we are not responsible for their practices or services. Please review their terms and privacy policies.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">7. Disclaimers and Limitations of Liability</h2>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">7.1 "As Is" Basis</h3>
              <p className="text-brand-text mb-4">
                The Website and Events are provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">7.2 Limitation of Liability</h3>
              <p className="text-brand-text mb-4">
                To the fullest extent permitted by law, Connect Events, Inc. and its officers, directors, employees, and agents shall not be liable for:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or use</li>
                <li>Personal injury or property damage arising from event attendance</li>
                <li>Errors or omissions in Website content</li>
                <li>Website downtime or technical failures</li>
              </ul>

              <h3 className="text-xl font-bold text-brand-header mt-6 mb-3">7.3 Indemnification</h3>
              <p className="text-brand-text mb-4">
                You agree to indemnify and hold harmless Connect Events, Inc. from any claims, damages, losses, liabilities, and expenses (including attorney fees) arising from:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Your use of the Website or attendance at Events</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
              </ul>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">8. Privacy</h2>
              <p className="text-brand-text mb-4">
                Your use of the Website is also governed by our Privacy Policy. Please review our <a href="/privacy-policy" className="text-brand-primary hover:text-brand-secondary">Privacy Policy</a> to understand how we collect, use, and protect your information.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">9. Email Communications</h2>
              <p className="text-brand-text mb-4">
                By providing your email address, you consent to receive communications from us, including:
              </p>
              <ul className="list-disc list-inside text-brand-text mb-4 ml-4">
                <li>Event announcements and updates</li>
                <li>Newsletters and promotional content</li>
                <li>Application status updates</li>
                <li>Important notices about the Website or Events</li>
              </ul>
              <p className="text-brand-text mb-4">
                You may unsubscribe from promotional emails at any time by clicking the unsubscribe link in the email or contacting us.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">10. Termination</h2>
              <p className="text-brand-text mb-4">
                We may terminate or suspend your access to the Website immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Website will immediately cease.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">11. Governing Law and Dispute Resolution</h2>
              <p className="text-brand-text mb-4">
                These Terms are governed by the laws of the State of Georgia, United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Website or Events shall be resolved in the state or federal courts located in Fulton County, Georgia.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">12. Severability</h2>
              <p className="text-brand-text mb-4">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">13. Changes to Terms</h2>
              <p className="text-brand-text mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by updating the "Last Updated" date at the top of this page. Your continued use of the Website or attendance at Events after changes constitutes acceptance of the updated Terms.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">14. Entire Agreement</h2>
              <p className="text-brand-text mb-4">
                These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and Connect Events, Inc. regarding the use of the Website and Events.
              </p>

              <h2 className="text-2xl font-bold text-brand-header mt-8 mb-4">15. Contact Information</h2>
              <p className="text-brand-text mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <ul className="list-none text-brand-text mb-4 ml-4">
                <li><strong>Email:</strong> <a href="mailto:info@connectevents.co" className="text-brand-primary hover:text-brand-secondary">info@connectevents.co</a></li>
                <li><strong>Website:</strong> <a href="https://connectevents.co" className="text-brand-primary hover:text-brand-secondary">connectevents.co</a></li>
                <li><strong>Business Name:</strong> Connect Events, Inc.</li>
                <li><strong>Location:</strong> Atlanta, Georgia, USA</li>
              </ul>

              <div className="mt-12 p-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-brand-primary/20">
                <p className="text-brand-text mb-2">
                  <strong>Related Policies:</strong>
                </p>
                <ul className="list-disc list-inside text-brand-text ml-4">
                  <li><a href="/privacy-policy" className="text-brand-primary hover:text-brand-secondary">Privacy Policy</a> - How we handle your personal information</li>
                  <li><a href="/cookie-policy" className="text-brand-primary hover:text-brand-secondary">Cookie Policy</a> - How we use cookies on our website</li>
                </ul>
              </div>

              <div className="mt-8 p-6 bg-brand-primary/10 rounded-lg border-2 border-brand-primary/30">
                <p className="text-sm text-brand-text">
                  <strong>Acknowledgment:</strong> By using this Website or attending Beats on the Beltline events, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  )
}
