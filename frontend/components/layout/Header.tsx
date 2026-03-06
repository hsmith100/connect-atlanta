import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Detect scroll direction for hide/show behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show/hide header based on scroll direction (only on mobile)
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down & past threshold - hide header
          setIsHeaderVisible(false)
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show header
          setIsHeaderVisible(true)
        }
      } else {
        // Always show header on desktop
        setIsHeaderVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
    // Keep header visible when menu is open
    if (!mobileMenuOpen) {
      setIsHeaderVisible(true)
    }
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header
      className={`bg-brand-bg/65 backdrop-blur-sm fixed w-full top-0 z-50 border-b border-gray-200 shadow-sm transition-transform duration-300 ${isHeaderVisible || mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
    >
      <nav className="section-container py-2.5 md:py-4">
        <div className="relative flex items-center justify-between md:justify-between">
          {/* Spacer for mobile to maintain layout */}
          <div className="md:hidden w-12"></div>

          {/* Logo - Centered on mobile, left on desktop */}
          <Link
            href="/"
            className="flex flex-col items-center group md:absolute md:left-0 md:translate-x-0"
            onClick={closeMobileMenu}
          >
            <img
              src="/images/ConnectLogoBIG-Black.svg"
              alt="Connect"
              width="400"
              height="114"
              className="hover:opacity-80 transition-opacity duration-300 h-16 w-auto md:h-12"
            />
            <span className="font-slogan text-sm text-brand-text tracking-wider uppercase mt-2 md:hidden">
              Home of Beats on the Beltline
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 ml-auto">
            <Link
              href="/"
              className="text-gray-800 hover:text-brand-primary transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-800 hover:text-brand-primary transition-colors font-medium"
            >
              About
            </Link>
            <Link
              href="/events"
              className="text-gray-800 hover:text-brand-primary transition-colors font-medium"
            >
              Events
            </Link>
            <Link
              href="/gallery"
              className="text-gray-800 hover:text-brand-primary transition-colors font-medium"
            >
              Gallery
            </Link>
            <Link
              href="/join"
              className="text-gray-800 hover:text-brand-primary transition-colors font-medium"
            >
              Join Us
            </Link>
            <Link
              href="/contact"
              className="text-gray-800 hover:text-brand-primary transition-colors font-medium"
            >
              Contact
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden relative z-10">
            <button
              onClick={toggleMobileMenu}
              className="btn btn-ghost btn-sm text-gray-800"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-gray-200 pt-4 animate-in fade-in slide-in-from-top-5 bg-white rounded-b-lg -mx-4 px-4">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="block text-gray-800 hover:text-brand-primary transition-colors font-medium py-2 px-4 rounded-lg hover:bg-gray-100"
            >
              Home
            </Link>
            <Link
              href="/about"
              onClick={closeMobileMenu}
              className="block text-gray-800 hover:text-brand-primary transition-colors font-medium py-2 px-4 rounded-lg hover:bg-gray-100"
            >
              About
            </Link>
            <Link
              href="/events"
              onClick={closeMobileMenu}
              className="block text-gray-800 hover:text-brand-primary transition-colors font-medium py-2 px-4 rounded-lg hover:bg-gray-100"
            >
              Events
            </Link>
            <Link
              href="/gallery"
              onClick={closeMobileMenu}
              className="block text-gray-800 hover:text-brand-primary transition-colors font-medium py-2 px-4 rounded-lg hover:bg-gray-100"
            >
              Gallery
            </Link>
            <Link
              href="/join"
              onClick={closeMobileMenu}
              className="block text-gray-800 hover:text-brand-primary transition-colors font-medium py-2 px-4 rounded-lg hover:bg-gray-100"
            >
              Join Us
            </Link>
            <Link
              href="/contact"
              onClick={closeMobileMenu}
              className="block text-gray-800 hover:text-brand-primary transition-colors font-medium py-2 px-4 rounded-lg hover:bg-gray-100"
            >
              Contact
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
