export interface Page {
  route: string;
  heading: string;
  headingDesktopOnly?: boolean;
}

export const CORE_PAGES: Page[] = [
  { route: '/events', heading: 'Events' },
  { route: '/join', heading: 'Join Us' },
  { route: '/contact', heading: 'Contact Us' },
  { route: '/gallery', heading: 'Event Gallery' },
  { route: '/sponsor-inquiries', heading: 'Sponsor Inquiries' },
  { route: '/shop', heading: 'Shop' },
  { route: '/about', heading: 'About Us' },
];
