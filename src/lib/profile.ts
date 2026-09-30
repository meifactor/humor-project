import { cache } from "react";
import { AVATAR_BUCKET } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
};

export function hasName(profile: Profile | null) {
  return Boolean(profile?.first_name?.trim() && profile?.last_name?.trim());
}

export function hasPhoto(profile: Profile | null) {
  return Boolean(profile?.avatar_path);
}

// New users must add both their name and a photo before using the app.
export function isProfileComplete(profile: Profile | null) {
  return hasName(profile) && hasPhoto(profile);
}

// The signed-in user plus their profile row, or null when signed out.
// Wrapped in cache() so the header and the page share one lookup per request.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_path")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const avatarUrl = profile?.avatar_path
    ? supabase.storage.from(AVATAR_BUCKET).getPublicUrl(profile.avatar_path)
        .data.publicUrl
    : null;

  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");

  return {
    user,
    profile,
    avatarUrl,
    displayName: fullName || user.email || "there",
    hasName: hasName(profile),
    hasPhoto: hasPhoto(profile),
    isComplete: isProfileComplete(profile),
  };
});
