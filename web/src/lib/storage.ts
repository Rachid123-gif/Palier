import { supabase } from "./supabase";

const BUCKET = "uploads";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return "File too large (max 5 MB)";
  if (!ALLOWED_MIME_TYPES.has(file.type)) return `File type not allowed: ${file.type}`;
  return null;
}

/** Upload an image for a voisinage post and return its public URL. */
export async function uploadPostImage(file: File): Promise<string | undefined> {
  const err = validateFile(file);
  if (err) { console.warn("[Upload] Rejected:", err); return undefined; }
  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `posts/${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) { console.warn("[Upload] Failed"); return undefined; }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload a photo for an incident and return its public URL. */
export async function uploadIncidentPhoto(file: File): Promise<string | undefined> {
  const err = validateFile(file);
  if (err) { console.warn("[Upload] Rejected:", err); return undefined; }
  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `incidents/${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) { console.warn("[Upload] Failed"); return undefined; }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
