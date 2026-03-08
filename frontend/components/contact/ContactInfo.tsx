import { Mail, MapPin } from 'lucide-react'

export default function ContactInfo() {
  return (
    <div>
      <h2 className="font-title text-3xl md:text-5xl font-black mb-4 text-brand-header uppercase">
        Get in touch
      </h2>
      <p className="text-lg text-brand-header/80 mb-8">
        Prefer to reach out directly? Use any of the methods below.
      </p>

      <div className="space-y-6">
        <div className="card-bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-brand-primary/20">
          <div className="mb-3 text-brand-primary">
            <Mail size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-brand-header mb-2">Email</h3>
          <a href="mailto:info@connectevents.co"
            className="text-brand-primary hover:text-brand-header transition-colors text-lg">
            info@connectevents.co
          </a>
        </div>

        <div className="card-bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-brand-primary/20">
          <div className="mb-3 text-brand-primary">
            <MapPin size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-bold text-brand-header mb-2">Location</h3>
          <p className="text-brand-header/80 text-lg">Atlanta, GA</p>
        </div>
      </div>

      <div className="mt-8 p-6 card-bg-white rounded-2xl shadow-lg border-2 border-brand-primary/20">
        <h3 className="text-xl font-bold text-brand-header mb-4">Follow Us</h3>
        <div className="flex gap-4">
          <a href="https://www.instagram.com/connect__atlanta" target="_blank" rel="noopener noreferrer"
            className="btn btn-circle btn-outline btn-primary hover:btn-primary" aria-label="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="https://www.facebook.com/profile.php?id=61573559046886" target="_blank" rel="noopener noreferrer"
            className="btn btn-circle btn-outline btn-primary hover:btn-primary" aria-label="Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a href="https://www.youtube.com/@Connect_Atlanta" target="_blank" rel="noopener noreferrer"
            className="btn btn-circle btn-outline btn-primary hover:btn-primary" aria-label="YouTube">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
            </svg>
          </a>
          <a href="https://www.tiktok.com/@connect__atlanta" target="_blank" rel="noopener noreferrer"
            className="btn btn-circle btn-outline btn-primary hover:btn-primary" aria-label="TikTok">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
