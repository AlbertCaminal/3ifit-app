"use client";

import { createClient } from "@/lib/supabase/client";
import { logError } from "@/lib/logger";
import { isValidImageFile } from "./uploadConstants";

export async function uploadFeedImageClient(file: File): Promise<string | null> {
  if (!isValidImageFile(file)) return null;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("feed-images")
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    logError("Upload error", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("feed-images")
    .getPublicUrl(path);

  return urlData.publicUrl;
}
