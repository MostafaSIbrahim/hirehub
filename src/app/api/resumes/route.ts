import { getSession } from "@/server/session";
import { saveResume } from "@/server/services/profile.service";
import { MAX_RESUME_BYTES } from "@/lib/validators/profile";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "SEEKER" || session.user.status === "SUSPENDED") {
    return Response.json({ error: "Not allowed." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("resume");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Choose a PDF file." }, { status: 400 });
  }
  if (file.size > MAX_RESUME_BYTES) {
    return Response.json({ error: "The file must be 5 MB or smaller." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Check the real content, not the file name or browser-reported type (both are trivial to fake).
  // Every PDF starts with the bytes "%PDF-".
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") {
    return Response.json({ error: "Only PDF files are allowed." }, { status: 400 });
  }

  const url = await saveResume(session.user.id, bytes);
  return Response.json({ url });
}