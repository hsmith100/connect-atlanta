import { formatTime, formatEventDate } from './formatters';

describe('formatTime', () => {
  it('formats afternoon time correctly', () => {
    expect(formatTime('14:30')).toBe('2:30 PM');
  });

  it('formats morning time with leading-zero hour', () => {
    expect(formatTime('09:05')).toBe('9:05 AM');
  });

  it('formats noon with no minutes as 12 PM', () => {
    // Implementation omits ":00" when minutes === 0
    expect(formatTime('12:00')).toBe('12 PM');
  });

  it('formats midnight as 12 AM', () => {
    expect(formatTime('00:00')).toBe('12 AM');
  });

  it('formats 13:00 as 1 PM', () => {
    expect(formatTime('13:00')).toBe('1 PM');
  });

  it('formats 11:59 as 11:59 AM', () => {
    expect(formatTime('11:59')).toBe('11:59 AM');
  });
});

describe('formatEventDate', () => {
  it('returns empty string for undefined', () => {
    expect(formatEventDate(undefined)).toBe('');
  });

  it('formats a date with "th" ordinal', () => {
    expect(formatEventDate('2026-03-06')).toBe('March 6th, 2026');
  });

  it('formats a date with "st" ordinal', () => {
    expect(formatEventDate('2026-03-01')).toBe('March 1st, 2026');
  });

  it('formats a date with "nd" ordinal', () => {
    expect(formatEventDate('2026-03-02')).toBe('March 2nd, 2026');
  });

  it('formats a date with "rd" ordinal', () => {
    expect(formatEventDate('2026-03-03')).toBe('March 3rd, 2026');
  });

  it('formats 21st correctly (not 21th)', () => {
    expect(formatEventDate('2026-03-21')).toBe('March 21st, 2026');
  });

  it('formats 11th correctly (teen exception)', () => {
    expect(formatEventDate('2026-03-11')).toBe('March 11th, 2026');
  });

  it('formats 12th correctly (teen exception)', () => {
    expect(formatEventDate('2026-03-12')).toBe('March 12th, 2026');
  });

  it('formats 13th correctly (teen exception)', () => {
    expect(formatEventDate('2026-03-13')).toBe('March 13th, 2026');
  });
});
