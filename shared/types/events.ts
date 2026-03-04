export interface Event {
  id: string;
  entity: string;
  title: string;
  date: string;             // ISO date string, e.g. "2026-04-25"
  startTime?: string | null; // 24-hour "HH:MM", e.g. "14:00"
  endTime?: string | null;   // 24-hour "HH:MM", e.g. "22:00"
  location?: string | null;
  flyerUrl?: string | null;
  attendees?: string | null;
  artists?: string | null;
  goLiveAt?: string | null; // ISO datetime; if set, event hidden until this time
  ticketingUrl?: string | null;
}
