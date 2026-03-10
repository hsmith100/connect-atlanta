export interface Page {
  route: string;
  heading: string;
}

export const CORE_PAGES: Page[] = [
  { route: '/', heading: 'Home of Beats on the Beltline' },
  { route: '/events', heading: 'Events' },
  { route: '/join', heading: 'Join Us' },
  { route: '/contact', heading: 'Contact Us' },
  { route: '/sponsor-inquiries', heading: 'Sponsor Inquiries' },
  { route: '/merch', heading: 'Merch' },
];
