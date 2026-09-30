import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { getCurrentUser } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

type Joke = { id: number; setup: string; punchline: string };

// A different joke each day, the same for everyone.
async function getJokeOfTheDay() {
  const supabase = await createClient();
  const { data: jokes } = await supabase
    .from("jokes")
    .select("id, setup, punchline")
    .order("id", { ascending: true })
    .returns<Joke[]>();

  if (!jokes?.length) {
    return null;
  }
  const dayNumber = Math.floor(Date.now() / 86_400_000);
  return jokes[dayNumber % jokes.length];
}

// Signed-in users only: the proxy redirects signed-out visitors, and this page checks again.
export default async function DashboardPage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login");
  }
  if (!current.isComplete) {
    redirect("/onboarding");
  }

  const jokeOfTheDay = await getJokeOfTheDay();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar url={current.avatarUrl} name={current.displayName} size={64} />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back, {current.profile?.first_name}!
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            This dashboard is only visible when you&apos;re signed in.
          </p>
        </div>
      </div>

      {jokeOfTheDay && (
        <section className="mt-10 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Your joke of the day
          </h2>
          <p className="mt-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {jokeOfTheDay.setup}
          </p>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{jokeOfTheDay.punchline}</p>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href="/profile" className="font-medium text-zinc-900 underline dark:text-zinc-50">
          Edit your profile
        </Link>
        <Link href="/" className="font-medium text-zinc-900 underline dark:text-zinc-50">
          See all jokes
        </Link>
      </div>
    </main>
  );
}
