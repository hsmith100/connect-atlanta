import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-brand-header text-white py-12">
      <div className="section-container">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo */}
          <img
            src="/images/ConnectBig-White.svg"
            alt="Connect"
            width="150"
            height="50"
          />

          {/* Social Media Links */}
          <div className="flex gap-4 justify-center mb-6">
            <a
              href="https://www.instagram.com/connect__atlanta"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-circle btn-outline border-white hover:bg-white hover:text-brand-header text-white"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61573559046886"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-circle btn-outline border-white hover:bg-white hover:text-brand-header text-white"
              aria-label="Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@Connect_Atlanta"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-circle btn-outline border-white hover:bg-white hover:text-brand-header text-white"
              aria-label="YouTube"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@connect__atlanta"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-circle btn-outline border-white hover:bg-white hover:text-brand-header text-white"
              aria-label="TikTok"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/privacy-policy"
              className="hover:text-brand-accent transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-conditions"
              className="hover:text-brand-accent transition-colors"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/cookie-policy"
              className="hover:text-brand-accent transition-colors"
            >
              Cookie Policy
            </Link>
            <Link
              href="/contact"
              className="hover:text-brand-accent transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-brand-neutral-100 text-sm text-center">
            Copyright 2025 Connect Events, Inc.
          </div>
        </div>
      </div>
    </footer>
  )
}
