export interface EmailSignupPayload {
  name: string;
  email: string;
  phone?: string | null;
  marketingConsent?: boolean;
  source?: string;
}

export interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface VolunteerApplicationPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  experience?: string | null;
  skills?: string[];
}

export interface VendorApplicationPayload {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  description: string;
  websiteSocial: string;
  pricePoint: string;
  hasInsurance: string;
  foodPermit: string;
  setup: string;
  additionalComments?: string | null;
}

export interface ArtistApplicationPayload {
  email: string;
  fullLegalName: string;
  djName: string;
  city: string;
  phone: string;
  instagramLink: string;
  contactMethod: string;
  mainGenre: string;
  subGenre: string;
  livePerformanceLinks: string;
  soundcloudLink: string;
  spotifyLink: string;
  rekordboxFamiliar: string;
  artistBio?: string | null;
  b2bFavorite?: string | null;
  otherSubGenre?: string | null;
  otherGenreText?: string | null;
  promoKitLinks?: string | null;
  additionalInfo?: string | null;
}

export interface SponsorInquiryPayload {
  name: string;
  email: string;
  phone: string;
  company: string;
  productIndustry: string;
}
