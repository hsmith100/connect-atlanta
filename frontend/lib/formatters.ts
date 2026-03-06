// Format "HH:MM" 24-hour to "H:MM AM/PM"
export const formatTime = (t: string): string => {
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, '0')} ${period}`
}

// Format date to "Month Day(th), Year"
// Parse parts directly to avoid UTC-midnight timezone shift from new Date("YYYY-MM-DD")
export const formatEventDate = (dateString: string | undefined): string => {
    if (!dateString) return ''

    const [year, month, day] = dateString.split('-').map(Number)
    const monthName = new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long' })

    const getOrdinalSuffix = (d: number): string => {
        if (d > 3 && d < 21) return 'th'
        switch (d % 10) {
            case 1: return 'st'
            case 2: return 'nd'
            case 3: return 'rd'
            default: return 'th'
        }
    }

    return `${monthName} ${day}${getOrdinalSuffix(day)}, ${year}`
}
