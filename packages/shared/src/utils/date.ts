export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function formatHour(iso: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    hour12: true,
  }).format(new Date(iso));
}

export function truncToHour(date: Date): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}
