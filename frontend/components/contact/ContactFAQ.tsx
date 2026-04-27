const FAQ_ITEMS = [
  {
    question: 'How can I perform at Beats on the Block?',
    answer: <>Head over to our <a href="/join" className="text-brand-primary hover:text-brand-header">Join Us page</a> and fill out the artist application form. We review all submissions and reach out to selected artists.</>,
  },
  {
    question: 'How can I become a vendor?',
    answer: <>Head over to our <a href="/join" className="text-brand-primary hover:text-brand-header">Join Us page</a> and fill out the vendor application form.</>,
  },
  {
    question: 'Are you available for partnerships?',
    answer: <>Yes! We are always open to new brand partnerships and sponsorship opportunities. Email us at <a href="mailto:info@connectevents.co" className="text-brand-primary hover:text-brand-header">info@connectevents.co</a> to discuss collaboration possibilities.</>,
  },
  {
    question: 'When is the next event?',
    answer: <>Check out our <a href="/events" className="text-brand-primary hover:text-brand-header">Events page</a> for upcoming dates, or sign up for our text and email updates to be the first to know about new event announcements.</>,
  },
]

export default function ContactFAQ() {
  return (
    <section className="py-12 md:py-20 bg-brand-bg">
      <div className="section-container max-w-4xl">
        <h2 className="font-title text-4xl md:text-6xl font-black text-center mb-4 text-brand-header uppercase">
          Quick Answers
        </h2>
        <p className="text-xl text-center text-brand-header/80 mb-12">
          Before reaching out, check if your question is answered here
        </p>

        <div className="space-y-4">
          {FAQ_ITEMS.map(({ question, answer }) => (
            <details key={question} className="rounded-xl border border-brand-primary/10 bg-brand-bg group">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 text-xl font-bold text-brand-header">
                {question}
                <span className="ml-4 text-brand-primary transition-transform duration-200 group-open:rotate-45">+</span>
              </summary>
              <div className="px-4 pb-4 text-brand-header/80">
                <p>{answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
