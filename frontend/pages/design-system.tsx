import SEO from '../components/shared/SEO'

export default function DesignSystem() {
  return (
    <>
      <SEO 
        title="Design System | Music Festival 2025"
        description="Design system and component showcase"
        noindex={true}
      />
      
      <div className="min-h-screen bg-brand-bg">
        {/* Header */}
        <header className="bg-brand-header text-white py-8">
          <div className="section-container">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">
              Festival Design System
            </h1>
            <p className="text-brand-accent text-lg">
              Brand colors, components, and design tokens
            </p>
          </div>
        </header>

        <div className="section-container">
          
          {/* Color Palette */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-brand-pink mb-6">Color Palette</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Header Color */}
              <div className="card-festival">
                <div className="bg-brand-header h-24 rounded-lg mb-4"></div>
                <h3 className="font-semibold text-brand-header">Header</h3>
                <p className="text-sm text-gray-600">#291058</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                  bg-brand-header
                </code>
              </div>

              {/* Primary */}
              <div className="card-festival">
                <div className="bg-brand-primary h-24 rounded-lg mb-4"></div>
                <h3 className="font-semibold text-brand-header">Primary (Buttons)</h3>
                <p className="text-sm text-gray-600">#8C52FF</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                  bg-brand-primary
                </code>
              </div>

              {/* Cyan Accent */}
              <div className="card-festival">
                <div className="bg-brand-accent h-24 rounded-lg mb-4"></div>
                <h3 className="font-semibold text-brand-header">Cyan Accent</h3>
                <p className="text-sm text-gray-600">#5CE1E6</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                  bg-brand-accent
                </code>
              </div>

              {/* Pink Accent */}
              <div className="card-festival">
                <div className="bg-brand-pink h-24 rounded-lg mb-4"></div>
                <h3 className="font-semibold text-brand-header">Pink (Titles)</h3>
                <p className="text-sm text-gray-600">#F81889</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                  bg-brand-pink
                </code>
              </div>

              {/* Peach Accent */}
              <div className="card-festival">
                <div className="bg-brand-peach h-24 rounded-lg mb-4"></div>
                <h3 className="font-semibold text-brand-header">Peach Accent</h3>
                <p className="text-sm text-gray-600">#FEB95F</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                  bg-brand-peach
                </code>
              </div>

              {/* Background */}
              <div className="card-festival">
                <div className="bg-brand-bg h-24 rounded-lg mb-4 border-2 border-gray-200"></div>
                <h3 className="font-semibold text-brand-header">Main Background</h3>
                <p className="text-sm text-gray-600">#F6F7FB</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                  bg-brand-bg
                </code>
              </div>
            </div>
          </section>

          {/* Buttons */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-brand-pink mb-6">Buttons</h2>
            
            <div className="space-y-6">
              {/* DaisyUI Buttons */}
              <div className="card-festival">
                <h3 className="text-xl font-semibold mb-4 text-brand-header">DaisyUI Buttons</h3>
                <div className="flex flex-wrap gap-4">
                  <button className="btn btn-primary">Primary Button</button>
                  <button className="btn btn-secondary">Secondary</button>
                  <button className="btn btn-accent">Accent</button>
                  <button className="btn btn-neutral">Neutral</button>
                  <button className="btn btn-outline btn-primary">Outline</button>
                  <button className="btn btn-ghost">Ghost</button>
                  <button className="btn btn-primary btn-sm">Small</button>
                  <button className="btn btn-primary btn-lg">Large</button>
                </div>
              </div>

              {/* Custom Festival Buttons */}
              <div className="card-festival">
                <h3 className="text-xl font-semibold mb-4 text-brand-header">Custom Festival Buttons</h3>
                <div className="flex flex-wrap gap-4">
                  <button className="btn-festival">Buy Tickets</button>
                  <button className="btn-festival-outline">Learn More</button>
                  <button className="btn-festival animate-pulse-glow">Get Tickets Now!</button>
                </div>
              </div>
            </div>
          </section>

          {/* Cards */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-brand-pink mb-6">Cards</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* DaisyUI Card */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-brand-primary">DaisyUI Card</h3>
                  <p className="text-brand-header">Standard DaisyUI card component with shadow.</p>
                  <div className="card-actions justify-end">
                    <button className="btn btn-primary btn-sm">Action</button>
                  </div>
                </div>
              </div>

              {/* Custom Festival Card */}
              <div className="card-festival">
                <h3 className="text-xl font-semibold text-brand-primary mb-2">Custom Card</h3>
                <p className="text-brand-header">Custom styled card with brand colors and hover effects.</p>
                <button className="btn-festival-outline mt-4">Learn More</button>
              </div>

              {/* Gradient Card */}
              <div className="gradient-bg rounded-2xl p-6 text-white">
                <h3 className="text-xl font-semibold mb-2">Gradient Card</h3>
                <p>Card with gradient background from brand colors.</p>
                <button className="bg-white text-brand-primary px-4 py-2 rounded-lg mt-4 font-semibold hover:bg-brand-accent transition-colors">
                  Action
                </button>
              </div>
            </div>
          </section>

          {/* Typography */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-brand-pink mb-6">Typography</h2>
            
            <div className="card-festival">
              <h1 className="text-5xl font-bold text-brand-pink mb-4">Heading 1</h1>
              <h2 className="text-4xl font-bold text-brand-pink mb-4">Heading 2</h2>
              <h3 className="text-3xl font-bold text-brand-pink mb-4">Heading 3</h3>
              <h4 className="text-2xl font-bold text-brand-pink mb-4">Heading 4</h4>
              
              <p className="text-brand-header text-lg mb-4">
                Regular paragraph text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
              
              <p className="gradient-text text-2xl font-bold mb-4">
                Gradient text for special emphasis
              </p>
              
              <p className="text-brand-accent font-semibold">
                Cyan accent text for highlights
              </p>
            </div>
          </section>

          {/* Badges & Tags */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-brand-pink mb-6">Badges & Tags</h2>
            
            <div className="card-festival">
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-primary">Primary</span>
                <span className="badge badge-secondary">Secondary</span>
                <span className="badge badge-accent">Accent</span>
                <span className="badge badge-info">Info</span>
                <span className="badge badge-success">Success</span>
                <span className="badge badge-warning">Warning</span>
                <span className="badge badge-error">Error</span>
                <span className="badge badge-outline badge-primary">Outline</span>
                <span className="badge badge-lg badge-primary">Large</span>
              </div>
            </div>
          </section>

          {/* Forms */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-brand-pink mb-6">Form Elements</h2>
            
            <div className="card-festival">
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-brand-header">Email</span>
                  </label>
                  <input 
                    type="email" 
                    placeholder="your@email.com" 
                    className="input input-bordered input-primary w-full max-w-xs" 
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-brand-header">Message</span>
                  </label>
                  <textarea 
                    className="textarea textarea-bordered textarea-primary" 
                    placeholder="Your message"
                    rows={3}
                  ></textarea>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" className="checkbox checkbox-primary" />
                    <span className="label-text text-brand-header">Subscribe to newsletter</span>
                  </label>
                </div>

                <button className="btn btn-primary">Submit</button>
              </div>
            </div>
          </section>

          {/* Special Effects */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-brand-pink mb-6">Special Effects</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Glow Effects */}
              <div className="card-festival">
                <h3 className="text-xl font-semibold text-brand-header mb-4">Glow Effects</h3>
                <div className="space-y-4">
                  <div className="bg-brand-accent p-4 rounded-lg glow text-brand-header font-semibold">
                    Cyan Glow
                  </div>
                  <div className="bg-brand-pink p-4 rounded-lg glow-pink text-white font-semibold">
                    Pink Glow
                  </div>
                  <div className="bg-brand-primary p-4 rounded-lg glow-purple text-white font-semibold">
                    Purple Glow
                  </div>
                </div>
              </div>

              {/* Glass Effect */}
              <div className="bg-gradient-to-br from-brand-primary to-brand-pink p-8 rounded-2xl">
                <div className="glass p-6 rounded-xl text-white">
                  <h3 className="text-xl font-semibold mb-2">Glassmorphism</h3>
                  <p>Frosted glass effect perfect for overlays and modern UI.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Alerts */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-brand-pink mb-6">Alerts</h2>
            
            <div className="space-y-4">
              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>New festival dates announced!</span>
              </div>
              
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Your ticket purchase was successful!</span>
              </div>
              
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>Only 50 tickets remaining!</span>
              </div>
              
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Event postponed due to weather.</span>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <footer className="bg-brand-header text-white py-8 mt-16">
          <div className="section-container text-center">
            <p className="text-brand-accent">Design System v1.0 | Music Festival 2025</p>
          </div>
        </footer>
      </div>
    </>
  )
}

