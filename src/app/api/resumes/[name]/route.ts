import { getSession } from "@/server/session";
import { loadFile } from "@/server/storage";
import { canViewResume } from "@/server/services/profile.service";

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  // Only accept exactly "<uuid>.pdf". This blocks path traversal like "../../.env".
  if (!/^[0-9a-f-]{36}\.pdf$/.test(name)) return notFound();

  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  // 404 (not 403) for people without access, so we don't even confirm the file exists.
  if (!(await canViewResume(session.user, `/api/resumes/${name}`))) return notFound();

  try {
    const file = await loadFile(`resumes/${name}`);
    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
        "Cache-Control": "private, no-store",  // never cache personal documents on shared proxies
        "X-Content-Type-Options": "nosniff",   // browser must treat it as a PDF, nothing else
      },
    });
  } catch {
    return notFound();
  }
}