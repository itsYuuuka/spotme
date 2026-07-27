export function toLocalDateStr(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}`;
}
