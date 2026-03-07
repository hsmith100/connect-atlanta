import type { Event } from '@shared/types/events'

// Returns start and end datetimes for an event, handling midnight crossover.
// Times are parsed as local time. If endTime < startTime, end is next calendar day.
export function getEventDatetimes(event: Event): { start: Date; end: Date } {
    const start = event.startTime
        ? new Date(`${event.date}T${event.startTime}`)
        : new Date(`${event.date}T23:59:59`)

    let end: Date
    if (event.endTime) {
        end = new Date(`${event.date}T${event.endTime}`)
        if (end <= start) end.setDate(end.getDate() + 1) // crosses midnight
    } else {
        end = new Date(`${event.date}T23:59:59`)
    }

    return { start, end }
}

// Returns the id of the event that should be the active tab.
// Priority: earliest unstarted event. If all have started, latest start time.
export function getDefaultActiveId(events: Event[]): string | null {
    if (events.length === 0) return null
    const now = new Date()
    const unstarted = events.filter(e => now < getEventDatetimes(e).start)
    if (unstarted.length > 0) {
        return unstarted.sort((a, b) =>
            getEventDatetimes(a).start.getTime() - getEventDatetimes(b).start.getTime()
        )[0].id
    }
    // All started — show the one with the latest start time
    return [...events].sort((a, b) =>
        getEventDatetimes(b).start.getTime() - getEventDatetimes(a).start.getTime()
    )[0].id
}

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
