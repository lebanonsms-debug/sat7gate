export function formatInTimezone(isoString: string | null | undefined, timezone: string = 'Asia/Beirut', format: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }) {
  if (!isoString) return '-'
  try {
    return new Date(isoString).toLocaleString('en-US', { ...format, timeZone: timezone })
  } catch {
    return new Date(isoString).toLocaleString('en-US', format)
  }
}
