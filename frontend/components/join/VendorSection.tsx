import { Store } from 'lucide-react'
import * as gtag from '../../lib/gtag'

export default function VendorSection() {
  return (
    <div id="application-form" className="py-12 md:py-20">
      <div className="section-container max-w-4xl">
        <div className="text-center mb-12">
          <div className="mb-6 text-brand-primary flex justify-center">
            <Store size={64} strokeWidth={1.5} />
          </div>
          <h2 className="font-title text-4xl md:text-6xl font-black mb-6 text-brand-header uppercase">
            Vendor Application
          </h2>
          <p className="text-xl text-brand-text font-bold max-w-2xl mx-auto">
            Join 30+ local vendors, food partners, and creative businesses at Atlanta's premier festival.
          </p>
        </div>

        <div className="text-center">
          <a
            href="https://forms.gle/UcEf4GF1Hg4FaY8D9"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-festival btn-lg inline-flex items-center gap-2"
            onClick={() => gtag.trackVendorApplication()}
          >
            <Store size={20} />
            Apply as a Vendor
          </a>
        </div>
      </div>
    </div>
  )
}
