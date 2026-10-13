import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { GenerationCard } from "@/components/generation-card";
import { getMyVotes, getUserGenerations } from "@/lib/feed";
import { getCurrentUser } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { deleteGeneration } from "./actions";
import { DeleteButton } from "./delete-button";

export const metadata: Metadata = { title: "My stuff · Humor Project" };

async function countMyVotes() {
  const supabase = await createClient();
  // RLS only lets users see their own votes, so this counts the current user's.
  const { count } = await supabase
    .from("caption_votes")
    .select("caption_id", { count: "exact", head: true });
  return count ?? 0;
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

  const [generations, votesCast] = await Promise.all([
    getUserGenerations(current.user.id),
    countMyVotes(),
  ]);
  const myVotes = await getMyVotes(generations.flatMap((g) => g.captions.map((c) => c.id)));
  const totalScore = generations.reduce(
    (sum, g) => sum + g.captions.reduce((s, c) => s + c.score, 0),
    0,
  );

  const stats = [
    { label: "Photos captioned", value: generations.length },
    { label: "Total caption score", value: totalScore },
    { label: "Votes you've cast", value: votesCast },
  ];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar url={current.avatarUrl} name={current.displayName} size={64} />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            My stuff
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Hey {current.profile?.first_name}, here&apos;s how your captions are doing.
          </p>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <dt className="text-xs text-zinc-500">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Your photos</h2>
        <Link
          href="/create"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + Caption a photo
        </Link>
      </div>

      {generations.length === 0 ? (
        <p className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          You haven&apos;t captioned any photos yet. Snap something on campus or
          on the subway and{" "}
          <Link href="/create" className="font-medium underline">
            see what the AI comes up with
          </Link>
          .
        </p>
      ) : (
        <div className="mt-4 space-y-8">
          {generations.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              myVotes={myVotes}
              signedIn
              actions={
                <form action={deleteGeneration}>
                  <input type="hidden" name="id" value={generation.id} />
                  <DeleteButton />
                </form>
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
