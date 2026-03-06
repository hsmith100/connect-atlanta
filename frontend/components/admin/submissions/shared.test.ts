import { filterByDate, fmt, downloadCsv } from './shared';
import type { Submission, DateFilter } from './shared';

// ── filterByDate ──────────────────────────────────────────────────────────────

describe('filterByDate', () => {
  const now = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };

  const items: Submission[] = [
    { id: 'a', createdAt: daysAgo(1) },   // 1 day ago
    { id: 'b', createdAt: daysAgo(6) },   // 6 days ago
    { id: 'c', createdAt: daysAgo(15) },  // 15 days ago
    { id: 'd', createdAt: daysAgo(45) },  // 45 days ago
    { id: 'e', createdAt: daysAgo(100) }, // 100 days ago
  ];

  it('returns all items when filter is "all"', () => {
    expect(filterByDate(items, 'all')).toHaveLength(5);
  });

  it('returns only items within last 7 days', () => {
    const result = filterByDate(items, '7');
    expect(result.map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('returns only items within last 30 days', () => {
    const result = filterByDate(items, '30');
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns only items within last 90 days', () => {
    const result = filterByDate(items, '90');
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('excludes items without a createdAt field', () => {
    const mixed: Submission[] = [{ id: 'x' }, { id: 'y', createdAt: daysAgo(1) }];
    const result = filterByDate(mixed, '7');
    expect(result.map((i) => i.id)).toEqual(['y']);
  });

  it('returns empty array when no items fall within window', () => {
    const old: Submission[] = [{ id: 'z', createdAt: daysAgo(60) }];
    expect(filterByDate(old, '7')).toHaveLength(0);
  });
});

// ── fmt ───────────────────────────────────────────────────────────────────────

describe('fmt', () => {
  it('returns "—" for undefined', () => {
    expect(fmt(undefined)).toBe('—');
  });

  it('returns a human-readable date string for a valid ISO string', () => {
    const result = fmt('2026-03-06T12:00:00.000Z');
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/Mar/);
  });

  it('returns a string for any valid ISO date', () => {
    expect(typeof fmt('2025-01-01T00:00:00.000Z')).toBe('string');
  });
});

// ── downloadCsv ───────────────────────────────────────────────────────────────

describe('downloadCsv', () => {
  let capturedContent: string;
  let clickMock: jest.Mock;
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;
  let createdAnchor: { href: string; download: string; click: jest.Mock };

  beforeEach(() => {
    capturedContent = '';
    clickMock = jest.fn();
    createObjectURL = jest.fn().mockReturnValue('blob:test-url');
    revokeObjectURL = jest.fn();
    createdAnchor = { href: '', download: '', click: clickMock };

    // Capture CSV content from Blob constructor instead of calling .text()
    jest.spyOn(global, 'Blob').mockImplementation((parts?: BlobPart[]) => {
      capturedContent = (parts ?? []).join('') as string;
      return { type: 'text/csv', size: capturedContent.length } as unknown as Blob;
    });

    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return createdAnchor as unknown as HTMLElement;
      return document.createElement(tag);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a CSV blob with header and data rows', () => {
    const rows: Submission[] = [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
    ];
    downloadCsv('test.csv', ['Name', 'Email'], rows, ['name', 'email']);

    expect(capturedContent).toContain('"Name","Email"');
    expect(capturedContent).toContain('"Alice","alice@example.com"');
    expect(capturedContent).toContain('"Bob","bob@example.com"');
  });

  it('escapes double quotes in values', () => {
    const rows: Submission[] = [{ name: 'O\'Brien, "Jr."', email: 'x@x.com' }];
    downloadCsv('test.csv', ['Name', 'Email'], rows, ['name', 'email']);
    expect(capturedContent).toContain('"O\'Brien, ""Jr."""');
  });

  it('triggers an anchor click with the correct filename', () => {
    downloadCsv('export.csv', ['A'], [{ a: '1' }], ['a']);
    expect(createdAnchor.download).toBe('export.csv');
    expect(clickMock).toHaveBeenCalledTimes(1);
  });

  it('revokes the object URL after click', () => {
    downloadCsv('export.csv', ['A'], [{ a: '1' }], ['a']);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('handles undefined/null values gracefully', () => {
    const rows: Submission[] = [{ name: null, email: undefined }];
    downloadCsv('test.csv', ['Name', 'Email'], rows, ['name', 'email']);
    expect(capturedContent).toContain('""');
  });
});
