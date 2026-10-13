import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Tabs } from "@/components/tabs";
import { VoteButtons } from "@/components/vote-buttons";
import {
  getCreatorLeaderboard,
  getMyVotes,
  getTopCaptions,
  type LeaderboardWindow,
} from "@/lib/feed";
import { getCurrentUser } from "@/lib/profile";

export const metadata: Metadata = { title: "Leaderboard · Humor Project" };

const WINDOWS: { value: LeaderboardWindow; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "all", label: "All time" },
];

const cardClass =
  "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";

export default async function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const { window: windowParam } = await searchParams;
  const window = WINDOWS.find((w) => w.value === windowParam)?.value ?? "today";

  const [current, topCaptions, creators] = await Promise.all([
    getCurrentUser(),
    getTopCaptions(window),
    getCreatorLeaderboard(),
  ]);
  const myVotes = current
    ? await getMyVotes(topCaptions.map((caption) => caption.id))
    : new Map();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Leaderboard
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        The funniest captions and the creators behind them.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Top captions</h2>
        <Tabs
          label="Time period"
          tabs={WINDOWS.map((w) => ({
            href: w.value === "today" ? "/leaderboard" : `/leaderboard?window=${w.value}`,
            label: w.label,
            active: w.value === window,
          }))}
        />
      </div>

      {topCaptions.length === 0 ? (
        <p className={`${cardClass} mt-4 p-6 text-zinc-600 dark:text-zinc-400`}>
          No upvoted captions yet for this period.{" "}
          <Link href="/" className="font-medium underline">
            Go vote on the feed
          </Link>
          .
        </p>
      ) : (
        <ol className={`${cardClass} mt-4 divide-y divide-zinc-100 dark:divide-zinc-800`}>
          {topCaptions.map((caption, index) => (
            <li key={caption.id} className="flex items-center gap-4 p-4">
              <span className="w-6 shrink-0 text-center text-lg font-semibold text-zinc-400">
                {index + 1}
              </span>
              <Link
                href={`/p/${caption.generationId}`}
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
              >
                <Image
                  src={caption.imageUrl}
                  alt="Captioned photo"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-zinc-900 dark:text-zinc-50">{caption.text}</p>
                <p className="mt-1 text-xs text-zinc-500">by {caption.creator.name}</p>
              </div>
              <VoteButtons
                captionId={caption.id}
                upvotes={caption.upvotes}
                downvotes={caption.downvotes}
                myVote={myVotes.get(caption.id) ?? null}
                signedIn={Boolean(current)}
              />
            </li>
          ))}
        </ol>
      )}

      <h2 className="mt-12 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Top creators</h2>
      <p className="mt-1 text-sm text-zinc-500">All time, by the total score of their captions.</p>

      {creators.length === 0 ? (
        <p className={`${cardClass} mt-4 p-6 text-zinc-600 dark:text-zinc-400`}>
          No creators yet.
        </p>
      ) : (
        <ol className={`${cardClass} mt-4 divide-y divide-zinc-100 dark:divide-zinc-800`}>
          {creators.map((creator, index) => (
            <li key={creator.userId} className="flex items-center gap-4 p-4">
              <span className="w-6 shrink-0 text-center text-lg font-semibold text-zinc-400">
                {index + 1}
              </span>
              <Avatar url={creator.avatarUrl} name={creator.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {creator.name}
                  {creator.userId === current?.user.id && (
                    <span className="ml-2 text-xs font-normal text-zinc-500">(you)</span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  {creator.generationCount} {creator.generationCount === 1 ? "photo" : "photos"}
                </p>
              </div>
              <span className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {creator.totalScore}
              </span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
