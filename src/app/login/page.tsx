import { redirect } from "next/navigation";
import { StationSign } from "@/components/station-sign";
import { getCurrentUser } from "@/lib/profile";
import { GoogleSignInButton } from "./google-sign-in-button";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-6 py-16">
      <StationSign as="h1" className="mt-2">
        Sign in
      </StationSign>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Sign in to see the full feed, react 💀 😂 😬 🤨 to captions and caption
        your own photos.
      </p>

      {typeof error === "string" && (
        <p
          role="alert"
          className="mt-6 rounded-md border-2 border-mta-red p-3 text-sm font-medium text-mta-red"
        >
          Sign-in failed: {error}
        </p>
      )}

      <div className="mt-8">
        <GoogleSignInButton />
      </div>
    </main>
  );
}
