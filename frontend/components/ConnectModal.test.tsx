import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectModal from './ConnectModal';

// scrollIntoView is not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = jest.fn();

const onClose = jest.fn();

beforeEach(() => {
  global.fetch = jest.fn();
  onClose.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── visibility ────────────────────────────────────────────────────────────────

describe('visibility', () => {
  it('renders nothing when isOpen is false', () => {
    render(<ConnectModal isOpen={false} onClose={onClose} />);
    expect(screen.queryByRole('button', { name: /close modal/i })).not.toBeInTheDocument();
  });

  it('renders form fields when isOpen is true', () => {
    render(<ConnectModal isOpen={true} onClose={onClose} />);
    expect(screen.getByLabelText(/name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
  });
});

// ── closing ───────────────────────────────────────────────────────────────────

describe('closing', () => {
  it('calls onClose when the close button is clicked', async () => {
    render(<ConnectModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const { container } = render(<ConnectModal isOpen={true} onClose={onClose} />);
    const backdrop = container.querySelector('.absolute.inset-0') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<ConnectModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose for other keys', () => {
    render(<ConnectModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ── form submission ───────────────────────────────────────────────────────────

describe('form submission', () => {
  it('sends the correct payload to the API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) });

    render(<ConnectModal isOpen={true} onClose={onClose} />);
    await user.type(screen.getByLabelText(/name \*/i), 'Alice');
    await user.type(screen.getByLabelText(/email \*/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /connect with us/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/forms/email-signup',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"Alice"'),
        }),
      ),
    );
    jest.useRealTimers();
  });

  it('shows success message after a successful submit', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) });

    render(<ConnectModal isOpen={true} onClose={onClose} />);
    await user.type(screen.getByLabelText(/name \*/i), 'Alice');
    await user.type(screen.getByLabelText(/email \*/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /connect with us/i }));

    await waitFor(() =>
      expect(screen.getByText(/thank you for signing up/i)).toBeInTheDocument(),
    );
    jest.useRealTimers();
  });

  it('calls onClose after 2 seconds on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) });

    render(<ConnectModal isOpen={true} onClose={onClose} />);
    await user.type(screen.getByLabelText(/name \*/i), 'Alice');
    await user.type(screen.getByLabelText(/email \*/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /connect with us/i }));

    await waitFor(() =>
      expect(screen.getByText(/thank you for signing up/i)).toBeInTheDocument(),
    );

    act(() => jest.advanceTimersByTime(2000));
    expect(onClose).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('shows error message when the request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) });

    render(<ConnectModal isOpen={true} onClose={onClose} />);
    await user.type(screen.getByLabelText(/name \*/i), 'Alice');
    await user.type(screen.getByLabelText(/email \*/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /connect with us/i }));

    await waitFor(() => expect(screen.getByText(/oops/i)).toBeInTheDocument());
    jest.useRealTimers();
  });

  it('shows error message when fetch throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime.bind(jest) });

    render(<ConnectModal isOpen={true} onClose={onClose} />);
    await user.type(screen.getByLabelText(/name \*/i), 'Alice');
    await user.type(screen.getByLabelText(/email \*/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /connect with us/i }));

    await waitFor(() => expect(screen.getByText(/oops/i)).toBeInTheDocument());
    jest.useRealTimers();
  });
});
