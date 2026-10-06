import { formatMoney } from './formatMoney'

describe('formatMoney', () => {
  it('formats whole dollars with cents', () => {
    expect(formatMoney(1500)).toBe('$15.00')
  })

  it('formats odd cents', () => {
    expect(formatMoney(3825)).toBe('$38.25')
  })

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('$0.00')
  })

  it('adds thousands separators', () => {
    expect(formatMoney(123456)).toBe('$1,234.56')
  })

  it('formats negative amounts', () => {
    expect(formatMoney(-675)).toBe('-$6.75')
  })
})
