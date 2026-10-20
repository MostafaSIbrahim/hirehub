import "server-only";

/** Out of scope for 3 days: real delivery. Same signature a real provider would get, so it's a 1-file swap later. */
export function sendEmail(to: string, subject: string, body: string) {
  console.info(`\n📧 EMAIL → ${to}\n   Subject: ${subject}\n   ${body}\n`);
}