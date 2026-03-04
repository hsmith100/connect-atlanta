import type { Event } from '@shared/types/events';
import { fetchAPI } from './client';

export async function getEvents(): Promise<Event[]> {
  return fetchAPI<Event[]>('/api/events');
}

export async function getEvent(eventId: string): Promise<Event> {
  return fetchAPI<Event>(`/api/events/${eventId}`);
}
