const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000], ["month", 2_592_000], ["week", 604_800],
  ["day", 86_400], ["hour", 3_600], ["minute", 60],
];

export function timeAgo(date: Date): string {
  const seconds = (date.getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function formatSalary(min: number | null, max: number | null, currency: string): string | null {
  const f = new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 });
  if (min != null && max != null) return `${f.format(min)} – ${f.format(max)} / month`;
  if (min != null) return `From ${f.format(min)} / month`;
  if (max != null) return `Up to ${f.format(max)} / month`;
  return null;
}