export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "") // "Café" → "cafe"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}