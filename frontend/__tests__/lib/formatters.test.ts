import { describe, it, expect } from 'vitest'
import { formatTime, formatEventDate } from '../../lib/formatters'

describe('formatTime', () => {
  it('formats midnight as 12 AM', () => {
    expect(formatTime('00:00')).toBe('12 AM')
  })

  it('formats noon as 12 PM', () => {
    expect(formatTime('12:00')).toBe('12 PM')
  })

  it('formats morning hours correctly', () => {
    expect(formatTime('09:00')).toBe('9 AM')
    expect(formatTime('08:30')).toBe('8:30 AM')
  })

  it('formats afternoon hours correctly', () => {
    expect(formatTime('13:00')).toBe('1 PM')
    expect(formatTime('14:45')).toBe('2:45 PM')
  })

  it('formats top-of-hour without minutes', () => {
    expect(formatTime('10:00')).toBe('10 AM')
    expect(formatTime('15:00')).toBe('3 PM')
  })

  it('formats non-zero minutes with leading zero padding', () => {
    expect(formatTime('09:05')).toBe('9:05 AM')
    expect(formatTime('16:09')).toBe('4:09 PM')
  })

  it('formats 11:59 PM correctly', () => {
    expect(formatTime('23:59')).toBe('11:59 PM')
  })

  it('formats 1:00 AM correctly', () => {
    expect(formatTime('01:00')).toBe('1 AM')
  })
})

describe('formatEventDate', () => {
  it('returns empty string for undefined', () => {
    expect(formatEventDate(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(formatEventDate('')).toBe('')
  })

  it('formats a date with "th" suffix (4th–20th)', () => {
    expect(formatEventDate('2025-06-14')).toBe('June 14th, 2025')
    expect(formatEventDate('2025-06-11')).toBe('June 11th, 2025')
    expect(formatEventDate('2025-06-13')).toBe('June 13th, 2025')
    expect(formatEventDate('2025-06-20')).toBe('June 20th, 2025')
  })

  it('formats the 1st with "st" suffix', () => {
    expect(formatEventDate('2025-09-01')).toBe('September 1st, 2025')
    expect(formatEventDate('2025-09-21')).toBe('September 21st, 2025')
    expect(formatEventDate('2025-10-31')).toBe('October 31st, 2025')
  })

  it('formats the 2nd with "nd" suffix', () => {
    expect(formatEventDate('2025-09-02')).toBe('September 2nd, 2025')
    expect(formatEventDate('2025-09-22')).toBe('September 22nd, 2025')
  })

  it('formats the 3rd with "rd" suffix', () => {
    expect(formatEventDate('2025-09-03')).toBe('September 3rd, 2025')
    expect(formatEventDate('2025-09-23')).toBe('September 23rd, 2025')
  })

  it('does not shift timezone for dates at midnight UTC', () => {
    // "2025-01-01" must display as January, not December
    expect(formatEventDate('2025-01-01')).toBe('January 1st, 2025')
  })

  it('handles end-of-year date correctly', () => {
    expect(formatEventDate('2025-12-31')).toBe('December 31st, 2025')
  })

  it('handles month boundary — first day of each month', () => {
    expect(formatEventDate('2025-03-01')).toBe('March 1st, 2025')
    expect(formatEventDate('2025-07-01')).toBe('July 1st, 2025')
  })

  it('includes the year in the output', () => {
    const result = formatEventDate('2026-04-15')
    expect(result).toContain('2026')
  })
})
