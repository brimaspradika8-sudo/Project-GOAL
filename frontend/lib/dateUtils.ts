export function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDateISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toIso(date: Date): string {
  return formatDateISO(date);
}
