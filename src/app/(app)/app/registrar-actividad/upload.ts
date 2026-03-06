"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rateLimit";
import { isValidImageFile } from "./uploadConstants";

export async function uploadFeedImage(formData: FormData): Promise<string | null> {
  const file = formData.get("file") as File | null;
  if (!file?.size || !isValidImageFile(file)) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (!(await checkRateLimit(user.id, "upload"))) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await supabase.storage
    .from("feed-images")
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    logError("Upload error", error, { path });
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("feed-images")
    .getPublicUrl(path);

  return urlData.publicUrl;
}
