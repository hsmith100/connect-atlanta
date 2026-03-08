export default function AboutHero() {
  return (
    <section className="py-8 md:py-12 relative overflow-hidden hero-gradient-gold">
      <div className="section-container relative z-10">
        <div className="text-center mb-12">
          <h1 className="font-horizon text-5xl md:text-7xl lg:text-8xl font-black mb-8 uppercase bg-gradient-to-r from-brand-pink via-brand-peach to-brand-primary bg-clip-text text-transparent">
            About Us
          </h1>
          <p className="text-2xl md:text-3xl text-brand-text font-bold max-w-4xl mx-auto">
            Atlanta's premier free outdoor electronic music experience
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-brand-header leading-relaxed mb-6">
              Beats on the Beltline is Atlanta's premier free one day music festival, bringing together thousands of people to celebrate community, culture, and creativity.
            </p>
            <p className="text-xl text-brand-header leading-relaxed mb-6">
              Set along the iconic Beltline, the southeast's heaviest foot traffic area, the event features high energy DJ performances across multiple stages, a curated lineup of local food vendors, bars, and interactive brand activations that create an unforgettable experience.
            </p>
            <p className="text-xl text-brand-header leading-relaxed">
              Beyond the music, Beats on the Beltline is a platform for local businesses, artists, and creators to connect with a vibrant and growing audience. Approaching 10,000 attendees per event, CONNECT events provide a space that amplifies talent and gives brands a powerful way to show up in the heart of Atlanta.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
