import { supabase } from "@/lib/supabase";

// Fetch fresh rows from Supabase on every request.
export const dynamic = "force-dynamic";

type Joke = {
  id: number;
  setup: string;
  punchline: string;
  created_at: string;
};

export default async function Home() {
  const { data: jokes, error } = await supabase
    .from("jokes")
    .select("id, setup, punchline, created_at")
    .order("id", { ascending: true })
    .returns<Joke[]>();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 font-sans">
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
