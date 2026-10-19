import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Local-disk implementation. In M6 we replace these two functions with cloud storage.
const ROOT = path.join(process.cwd(), "storage");

export async function saveFile(key: string, data: Uint8Array): Promise<void> {
  const fullPath = path.join(ROOT, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, data);
}

export async function loadFile(key: string): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await readFile(path.join(ROOT, key)));
}