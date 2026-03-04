import { ArtistsSection } from './submissions/ArtistsSection'
import { SponsorsSection } from './submissions/SponsorsSection'
import { EmailSignupsSection } from './submissions/EmailSignupsSection'
import type { Submission } from './submissions/shared'

interface Props {
  adminKey: string
  artists: Submission[]
  sponsors: Submission[]
  emailSignups: Submission[]
}

export function SubmissionsTab({ adminKey, artists, sponsors, emailSignups }: Props) {
  return (
    <div className="p-6 space-y-10 max-w-5xl mx-auto">
      <ArtistsSection artists={artists} />
      <hr className="border-gray-800" />
      <SponsorsSection sponsors={sponsors} adminKey={adminKey} />
      <hr className="border-gray-800" />
      <EmailSignupsSection signups={emailSignups} />
    </div>
  )
}
