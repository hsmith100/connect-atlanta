import { Users } from 'lucide-react'
import * as gtag from '../../lib/gtag'

export default function VolunteerSection() {
  return (
    <div id="application-form" className="py-12 md:py-20">
      <div className="section-container max-w-4xl">
        <div className="text-center mb-12">
          <div className="mb-6 text-brand-primary flex justify-center">
            <Users size={64} strokeWidth={1.5} />
          </div>
          <h2 className="font-title text-4xl md:text-6xl font-black mb-6 text-brand-header uppercase">
            Volunteer Application
          </h2>
          <p className="text-xl text-brand-text font-bold max-w-2xl mx-auto">
            Help make the magic happen! Join our volunteer team and be part of creating an unforgettable experience.
          </p>
        </div>

        <div className="text-center">
          <a
            href="https://forms.gle/fWyoSrm2koijynxS7"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-festival btn-lg inline-flex items-center gap-2"
            onClick={() => gtag.trackVolunteerApplication()}
          >
            <Users size={20} />
            Apply to Volunteer
          </a>
        </div>
      </div>
    </div>
  )
}
