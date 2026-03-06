import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Detección por URL (formato antiguo de Google con "default-user") */
function isGoogleDefaultAvatarByUrl(url: string): boolean {
  if (!url.includes("googleusercontent.com")) return false;
  return (
    url.includes("default-user") ||
    url.includes("default_user") ||
    url.includes("/-/default-user") ||
    /\/a\/default-user/i.test(url)
  );
}

/** Usa People API para detectar avatar por defecto (iniciales auto-generadas) */
async function isGoogleDefaultAvatarByPeopleApi(
  providerToken: string
): Promise<boolean> {
  try {
    const res = await fetch(
      "https://people.googleapis.com/v1/people/me?personFields=photos",
      {
        headers: { Authorization: `Bearer ${providerToken}` },
      }
    );
    if (!res.ok) return false;
    const data = (await res.json()) as {
      photos?: Array<{ default?: boolean; metadata?: { primary?: boolean } }>;
    };
    const primaryPhoto = data.photos?.find((p) => p.metadata?.primary);
    return primaryPhoto?.default === true;
  } catch {
    return false;
  }
}

async function fetchAndStoreAvatar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  googleUrl: string,
  userId: string
): Promise<string | null> {
  try {
    const res = await fetch(googleUrl, {
      headers: { "User-Agent": "3iFit-App/1.0" },
    });
    if (!res.ok) return null;

    const blob = await res.blob();
    const ext = blob.type?.includes("png") ? "png" : "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("feed-images")
      .upload(path, blob, { upsert: true, contentType: blob.type });

    if (error) return null;

    const {
      data: { publicUrl },
    } = supabase.storage.from("feed-images").getPublicUrl(path);
    return publicUrl;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const meta = data.user.user_metadata;
      const googleAvatarUrl = meta?.picture ?? meta?.avatar_url ?? null;
      const fullName = meta?.full_name ?? meta?.name ?? null;
      const providerToken = data.session?.provider_token ?? null;

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (googleAvatarUrl) {
        let isDefault = isGoogleDefaultAvatarByUrl(googleAvatarUrl);
        if (!isDefault && providerToken) {
          isDefault = await isGoogleDefaultAvatarByPeopleApi(providerToken);
        }
        if (isDefault) {
          updates.avatar_url = null;
        } else {
          const storedUrl =
            (await fetchAndStoreAvatar(
              supabase,
              googleAvatarUrl,
              data.user.id
            )) ?? googleAvatarUrl;
          updates.avatar_url = storedUrl;
        }
      }
      if (fullName) updates.full_name = fullName;

      if (Object.keys(updates).length > 1) {
        await supabase
          .from("profiles")
          .update(updates)
          .eq("id", data.user.id);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
