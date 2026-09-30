import Link from "next/link";
import { getCurrentUser } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

// Fetch fresh rows from Supabase on every request.
export const dynamic = "force-dynamic";

type Joke = {
  id: number;
  setup: string;
  punchline: string;
  created_at: string;
};

export default async function Home() {
  const current = await getCurrentUser();
  const supabase = await createClient();
  const { data: jokes, error } = await supabase
    .from("jokes")
    .select("id, setup, punchline, created_at")
    .order("id", { ascending: true })
    .returns<Joke[]>();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 font-sans">
      {current && !current.isComplete && (
        <p className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          Your profile isn&apos;t finished yet.{" "}
          <Link href="/onboarding" className="font-medium underline">
            {current.hasName ? "Add a profile photo" : "Add your name and photo"}
          </Link>
        </p>
      )}

      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Jokes
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Rows loaded from the Supabase <code>jokes</code> table.
      </p>

      {error ? (
        <p className="mt-8 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          Could not load jokes: {error.message}
        </p>
      ) : !jokes || jokes.length === 0 ? (
        <p className="mt-8 text-zinc-600 dark:text-zinc-400">No jokes yet.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {jokes.map((joke) => (
            <li
              key={joke.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {joke.setup}
              </p>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {joke.punchline}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
