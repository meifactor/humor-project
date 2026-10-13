import Link from "next/link";
import { GenerationCard } from "@/components/generation-card";
import { Tabs } from "@/components/tabs";
import { getFeed, getMyVotes, type FeedSort } from "@/lib/feed";
import { getCurrentUser } from "@/lib/profile";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { sort: sortParam } = await searchParams;
  const sort: FeedSort = sortParam === "top" ? "top" : "new";

  const current = await getCurrentUser();
  const { generations, error } = await getFeed(sort);
  const myVotes = current
    ? await getMyVotes(generations.flatMap((g) => g.captions.map((c) => c.id)))
    : new Map();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      {current && !current.isComplete && (
        <p className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          Your profile is missing your name.{" "}
          <Link href="/onboarding" className="font-medium underline">
            Add your first and last name
          </Link>
        </p>
      )}

      <section className="rounded-xl bg-zinc-900 px-6 py-8 text-white dark:bg-zinc-100 dark:text-zinc-900">
        <h1 className="text-3xl font-semibold tracking-tight">Caption the city.</h1>
        <p className="mt-2 text-zinc-300 dark:text-zinc-600">
          Upload a photo from campus, the subway or your weekend in NYC. AI writes
          the captions, everyone votes on the funniest.
        </p>
        <Link
          href={current ? "/create" : "/login"}
          className="mt-5 inline-block rounded-lg bg-white px-4 py-2 font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-700"
        >
          {current ? "+ Caption a photo" : "Sign in to start"}
        </Link>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {sort === "top" ? "Top today" : "Latest"}
        </h2>
        <Tabs
          label="Sort the feed"
          tabs={[
            { href: "/", label: "New", active: sort === "new" },
            { href: "/?sort=top", label: "Top today", active: sort === "top" },
          ]}
        />
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          Could not load the feed: {error.message}
        </p>
      ) : generations.length === 0 ? (
        <p className="mt-6 text-zinc-600 dark:text-zinc-400">
          {sort === "top"
            ? "Nothing posted in the last 24 hours yet. Be the first!"
            : "No photos yet. Be the first to caption one!"}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {generations.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              myVotes={myVotes}
              signedIn={Boolean(current)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
