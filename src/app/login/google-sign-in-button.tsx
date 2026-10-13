"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// "dark" for light backgrounds, "light" for use on black station signs.
export function GoogleSignInButton({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      // Exactly /auth/callback, with no extra query parameters.
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    // On success the browser navigates to Google, so only errors land here.
    if (error) {
      setError(error.message);
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className={`w-full rounded-full px-4 py-3 font-bold transition disabled:opacity-60 ${
          variant === "light"
            ? "bg-white text-black hover:bg-zinc-200"
            : "bg-black text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        }`}
      >
        {pending ? "Redirecting to Google…" : "Continue with Google"}
      </button>
      {error && (
        <p
          role="alert"
          className={`mt-3 text-sm ${variant === "light" ? "text-red-400" : "text-red-700 dark:text-red-400"}`}
        >
          {error}
        </p>
      )}
    </div>
  );
}
