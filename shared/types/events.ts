export interface Event {
  id: string;
  entity: string;
  title: string;
  date: string;
  flyerUrl?: string | null;
  attendees?: string | null;
  artists?: string | null;
}
