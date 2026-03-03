export interface Event {
  id: string;
  entity: string;
  title: string;
  date: string;             // ISO date string, e.g. "2026-04-25"
  time?: string | null;     // display string, e.g. "2:00 PM - 10:00 PM"
  location?: string | null;
  flyerUrl?: string | null;
  attendees?: string | null;
  artists?: string | null;
  goLiveAt?: string | null; // ISO datetime; if set, event hidden until this time
  ticketingUrl?: string | null;
}
