import { supabase } from "./supabase";

const BUCKET = "uploads";

/** Upload an image for a voisinage post and return its public URL. */
export async function uploadPostImage(file: File): Promise<string | undefined> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) { console.error("Upload failed:", error.message); return undefined; }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload a photo for an incident and return its public URL. */
export async function uploadIncidentPhoto(file: File): Promise<string | undefined> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `incidents/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) { console.error("Upload failed:", error.message); return undefined; }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
