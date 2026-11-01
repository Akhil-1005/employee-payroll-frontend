/** Local date as yyyy-MM-dd (the format the API expects). */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function today(): string {
  return toIsoDate(new Date());
}

export function firstDayOfCurrentMonth(): string {
  const now = new Date();
  return toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

/** Current month as yyyy-MM. */
export function currentMonth(): string {
  return today().slice(0, 7);
}
