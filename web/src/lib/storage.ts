import { supabase } from "./supabase";

const BUCKET = "uploads";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return "File too large (max 5 MB)";
  if (!ALLOWED_MIME_TYPES.has(file.type)) return `File type not allowed: ${file.type}`;
  return null;
}

/** Get safe extension from MIME type (not from user-provided filename) */
function safeExt(file: File): string {
  return MIME_TO_EXT[file.type] ?? "bin";
}

/** Upload an image for a voisinage post and return its public URL. */
export async function uploadPostImage(file: File): Promise<string | undefined> {
  const err = validateFile(file);
  if (err) { throw new Error(err); }
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt(file)}`;
  const path = `posts/${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) { throw new Error("upload_failed"); }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload a document (PDF/DOC/XLS) for a voisinage post and return its public URL. */
export async function uploadPostDocument(file: File): Promise<string | undefined> {
  const err = validateFile(file);
  if (err) { throw new Error(err); }
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt(file)}`;
  const path = `documents/${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) { throw new Error("upload_failed"); }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload a photo for an incident and return its public URL. */
export async function uploadIncidentPhoto(file: File): Promise<string | undefined> {
  const err = validateFile(file);
  if (err) { throw new Error(err); }
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt(file)}`;
  const path = `incidents/${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) { throw new Error("upload_failed"); }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
