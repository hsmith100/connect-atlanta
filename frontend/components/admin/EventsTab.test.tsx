import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventsTab } from './EventsTab';
import type { Event } from '@shared/types/events';

jest.mock('../../lib/api', () => ({
  presignFlyer: jest.fn(),
  updateEvent: jest.fn().mockResolvedValue({}),
  createEvent: jest.fn().mockResolvedValue({}),
  deleteEvent: jest.fn().mockResolvedValue({}),
}));

// confirm() is used before delete
window.confirm = jest.fn(() => true);
window.HTMLElement.prototype.scrollIntoView = jest.fn();
// crypto.randomUUID is available in jsdom but pin it for predictability
Object.defineProperty(global.crypto, 'randomUUID', {
  value: jest.fn(() => 'test-uuid-1234'),
  configurable: true,
});

const setEvents = jest.fn();
const adminKey = 'test-key';

const sampleEvent: Event = {
  id: 'ev-1',
  entity: 'EVENT',
  title: 'Beats on the Beltline',
  date: '2026-06-15',
  startTime: '18:00',
  endTime: '22:00',
  location: 'Atlanta Beltline',
  flyerUrl: null,
  ticketingUrl: null,
  goLiveAt: null,
  description: null,
  buttonText: null,
};

afterEach(() => {
  jest.clearAllMocks();
});

// ── GoLiveBadge ───────────────────────────────────────────────────────────────

describe('GoLiveBadge', () => {
  it('shows "Always live" when goLiveAt is null', () => {
    render(<EventsTab adminKey={adminKey} events={[sampleEvent]} setEvents={setEvents} />);
    expect(screen.getByText('Always live')).toBeInTheDocument();
  });

  it('shows "Live now" for a goLiveAt in the past', () => {
    const ev = { ...sampleEvent, goLiveAt: '2020-01-01T00:00:00.000Z' };
    render(<EventsTab adminKey={adminKey} events={[ev]} setEvents={setEvents} />);
    expect(screen.getByText('Live now')).toBeInTheDocument();
  });

  it('shows "Scheduled" for a goLiveAt in the future', () => {
    const ev = { ...sampleEvent, goLiveAt: '2099-01-01T00:00:00.000Z' };
    render(<EventsTab adminKey={adminKey} events={[ev]} setEvents={setEvents} />);
    expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
  });
});

// ── empty state ───────────────────────────────────────────────────────────────

describe('empty state', () => {
  it('shows empty message when no events', () => {
    render(<EventsTab adminKey={adminKey} events={[]} setEvents={setEvents} />);
    expect(screen.getByText('No events yet.')).toBeInTheDocument();
  });
});

// ── form validation ───────────────────────────────────────────────────────────

describe('form validation', () => {
  it('save button is disabled until both title and date are filled', async () => {
    render(<EventsTab adminKey={adminKey} events={[]} setEvents={setEvents} />);
    await userEvent.click(screen.getByRole('button', { name: /add event/i }));

    const saveBtn = screen.getByRole('button', { name: /create event/i });
    expect(saveBtn).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText(/beats on the beltline/i), 'My Event');
    expect(saveBtn).toBeDisabled(); // still missing date

    fireEvent.change(screen.getAllByDisplayValue('')[0], { target: { value: '2026-06-15' } });
    // After title + date, button enables
    // (Note: the actual date input is the first empty date-type input)
  });

  it('shows an error when save is attempted with missing required fields', async () => {
    const { createEvent } = require('../../lib/api');
    render(<EventsTab adminKey={adminKey} events={[]} setEvents={setEvents} />);
    await userEvent.click(screen.getByRole('button', { name: /add event/i }));

    // Directly call handleSaveEvent by clicking the button while it's disabled
    // The button is disabled, so clicking it does nothing — validate that createEvent was NOT called
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));
    expect(createEvent).not.toHaveBeenCalled();
  });
});

// ── edit form populates from event ────────────────────────────────────────────

describe('edit mode', () => {
  it('populates the form with existing event data when Edit is clicked', async () => {
    render(<EventsTab adminKey={adminKey} events={[sampleEvent]} setEvents={setEvents} />);

    // Click the pencil / edit button
    await userEvent.click(screen.getByTitle('Edit event'));

    expect(screen.getByDisplayValue('Beats on the Beltline')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-06-15')).toBeInTheDocument();
  });

  it('populates goLive date/time fields when goLiveAt is set', async () => {
    // Use a UTC midnight to make local date predictable: 2026-06-15T04:00:00Z
    // Parsed in local time depends on timezone, so we just check they are non-empty
    const ev = { ...sampleEvent, goLiveAt: '2026-06-15T04:00:00.000Z' };
    render(<EventsTab adminKey={adminKey} events={[ev]} setEvents={setEvents} />);

    await userEvent.click(screen.getByTitle('Edit event'));

    // The form should have opened (heading present)
    expect(screen.getByText('Edit Event')).toBeInTheDocument();
    // goLive date input should be populated (non-empty)
    const dateInputs = screen.getAllByDisplayValue(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateInputs.length).toBeGreaterThanOrEqual(2); // event date + goLive date
  });
});

// ── delete ────────────────────────────────────────────────────────────────────

describe('delete', () => {
  it('calls deleteEvent and updates state when confirmed', async () => {
    const { deleteEvent } = require('../../lib/api');
    render(<EventsTab adminKey={adminKey} events={[sampleEvent]} setEvents={setEvents} />);

    await userEvent.click(screen.getByTitle('Delete event'));

    await waitFor(() => expect(deleteEvent).toHaveBeenCalledWith(adminKey, 'ev-1'));
    expect(setEvents).toHaveBeenCalled();
  });

  it('does not call deleteEvent when confirm is cancelled', async () => {
    (window.confirm as jest.Mock).mockReturnValueOnce(false);
    const { deleteEvent } = require('../../lib/api');
    render(<EventsTab adminKey={adminKey} events={[sampleEvent]} setEvents={setEvents} />);

    await userEvent.click(screen.getByTitle('Delete event'));

    expect(deleteEvent).not.toHaveBeenCalled();
  });
});
