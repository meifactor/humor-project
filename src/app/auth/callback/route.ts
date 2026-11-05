import { NextResponse, type NextRequest } from "next/server";
import { isProfileComplete, type Profile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

// Supabase redirects here after Google sign-in with a one-time `code`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const loginWithError = (message: string) =>
    NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`,
    );

  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    // The database rejects sign-ups from emails that aren't on the allowed lists
    // (enforce_signup_allowlist trigger), which Supabase reports as a generic database error.
    if (/database error saving new user/i.test(providerError)) {
      return loginWithError(
        "Sign-ups are limited to Columbia and Barnard email addresses (and a few approved accounts). Try signing in with your school Google account.",
      );
    }
    return loginWithError(providerError);
  }

  const code = searchParams.get("code");
  if (!code) {
    return loginWithError("Sign-in link is missing its code. Please try again.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return loginWithError(error.message);
  }

  // First-time users (no name yet) are sent to fill in their name.
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_path")
    .eq("id", data.user.id)
    .maybeSingle<Profile>();

  const next = isProfileComplete(profile) ? "/dashboard" : "/onboarding";
  return NextResponse.redirect(`${origin}${next}`);
}
