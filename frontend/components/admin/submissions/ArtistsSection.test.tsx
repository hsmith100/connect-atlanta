import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArtistsSection } from './ArtistsSection';
import { downloadCsv } from './shared';

// Mock downloadCsv to avoid Blob/DOM side effects
jest.mock('./shared', () => ({
  ...jest.requireActual('./shared'),
  downloadCsv: jest.fn(),
}));

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const artists = [
  { id: 'a1', djName: 'DJ Alpha', email: 'a@ex.com', city: 'Atlanta', mainGenre: 'House', createdAt: daysAgo(1) },
  { id: 'a2', djName: 'DJ Beta',  email: 'b@ex.com', city: 'Atlanta', mainGenre: 'Techno', createdAt: daysAgo(20) },
  { id: 'a3', djName: 'DJ Gamma', email: 'g@ex.com', city: 'Atlanta', mainGenre: 'Disco', createdAt: daysAgo(60) },
];

afterEach(() => {
  jest.clearAllMocks();
});

// ── rendering ─────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('shows all artists and correct count when filter is "all"', () => {
    render(<ArtistsSection artists={artists} />);
    expect(screen.getByText('DJ Applications (3)')).toBeInTheDocument();
    expect(screen.getByText('DJ Alpha')).toBeInTheDocument();
    expect(screen.getByText('DJ Beta')).toBeInTheDocument();
    expect(screen.getByText('DJ Gamma')).toBeInTheDocument();
  });

  it('shows empty state when no artists', () => {
    render(<ArtistsSection artists={[]} />);
    expect(screen.getByText(/no submissions in this period/i)).toBeInTheDocument();
  });
});

// ── date filter ───────────────────────────────────────────────────────────────

describe('date filter', () => {
  it('filters to last 7 days when selected', () => {
    render(<ArtistsSection artists={artists} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '7' } });
    expect(screen.getByText('DJ Applications (1)')).toBeInTheDocument();
    expect(screen.getByText('DJ Alpha')).toBeInTheDocument();
    expect(screen.queryByText('DJ Beta')).not.toBeInTheDocument();
  });

  it('filters to last 30 days when selected', () => {
    render(<ArtistsSection artists={artists} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '30' } });
    expect(screen.getByText('DJ Applications (2)')).toBeInTheDocument();
    expect(screen.queryByText('DJ Gamma')).not.toBeInTheDocument();
  });

  it('shows all when filter is set back to "all"', () => {
    render(<ArtistsSection artists={artists} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '7' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'all' } });
    expect(screen.getByText('DJ Applications (3)')).toBeInTheDocument();
  });
});

// ── CSV export ────────────────────────────────────────────────────────────────

describe('CSV export', () => {
  it('calls downloadCsv with the current filtered rows when Export CSV is clicked', () => {
    render(<ArtistsSection artists={artists} />);
    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));
    expect(downloadCsv).toHaveBeenCalledTimes(1);
    expect(downloadCsv).toHaveBeenCalledWith(
      'dj-applications.csv',
      expect.any(Array),
      artists, // all 3 (filter is "all")
      expect.any(Array),
    );
  });

  it('exports only the filtered subset', () => {
    render(<ArtistsSection artists={artists} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));
    const rows = (downloadCsv as jest.Mock).mock.calls[0][2];
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('a1');
  });
});
