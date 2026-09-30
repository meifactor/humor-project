import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/profile";
import { GoogleSignInButton } from "./google-sign-in-button";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Sign in
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Sign in to see your dashboard and set up your profile.
      </p>

      {typeof error === "string" && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
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
