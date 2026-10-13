import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { LineBullet } from "@/components/line-bullet";
import { ReactionBar } from "@/components/reaction-bar";
import { SignInWall } from "@/components/sign-in-wall";
import { StationSign } from "@/components/station-sign";
import { Tabs } from "@/components/tabs";
import { cardClass } from "@/components/ui";
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

// Signed-out visitors see this many top captions before the sign-in wall.
const PREVIEW_COUNT = 3;

// Rank numbers styled as line bullets, cycling through subway colors.
const RANK_COLORS = ["#EE352E", "#FCCC0A", "#00933C", "#0039A6", "#FF6319", "#B933AD", "#6CBE45"];

function RankBullet({ rank }: { rank: number }) {
  const color = RANK_COLORS[(rank - 1) % RANK_COLORS.length];
  return (
    <LineBullet color={color} textColor={color === "#FCCC0A" ? "#000000" : "#FFFFFF"} size={30}>
      {rank}
    </LineBullet>
  );
}

export default async function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const { window: windowParam } = await searchParams;
  const current = await getCurrentUser();
  const signedIn = Boolean(current);
  const window = WINDOWS.find((w) => w.value === windowParam)?.value ?? "today";

  const [topCaptions, creators] = await Promise.all([
    getTopCaptions(window, signedIn ? 20 : PREVIEW_COUNT),
    signedIn ? getCreatorLeaderboard() : Promise.resolve([]),
  ]);
  const myVotes = signedIn
    ? await getMyVotes(topCaptions.map((caption) => caption.id))
    : new Map();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <StationSign as="h1">Leaderboard</StationSign>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Score = 💀 ×2 + 😂 ×1 − 🤨 ×1. Cringe is free (we&apos;ve all been there).
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Top captions</h2>
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
        <p className={`${cardClass} mt-4 p-6`}>
          No captions scored yet for this period.{" "}
          <Link href="/" className="font-bold underline">
            Go react on the feed
          </Link>
          .
        </p>
      ) : (
        <ol className={`${cardClass} mt-4 divide-y-2 divide-zinc-200 dark:divide-zinc-800`}>
          {topCaptions.map((caption, index) => (
            <li key={caption.id} className="flex gap-4 p-4">
              <RankBullet rank={index + 1} />
              <Link
                href={`/p/${caption.generationId}`}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 border-line bg-black"
              >
                <Image src={caption.imageUrl} alt="Captioned photo" fill unoptimized className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-medium leading-snug">{caption.text}</p>
                <p className="text-xs text-zinc-500">
                  by {caption.creator.name} · score {caption.score}
                </p>
                <ReactionBar
                  captionId={caption.id}
                  counts={caption.counts}
                  myReaction={myVotes.get(caption.id) ?? null}
                  signedIn={signedIn}
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      {signedIn ? (
        <>
          <h2 className="mt-12 text-xl font-bold">Top creators</h2>
          <p className="mt-1 text-sm text-zinc-500">All time, by the total score of their captions.</p>

          {creators.length === 0 ? (
            <p className={`${cardClass} mt-4 p-6`}>No creators yet.</p>
          ) : (
            <ol className={`${cardClass} mt-4 divide-y-2 divide-zinc-200 dark:divide-zinc-800`}>
              {creators.map((creator, index) => (
                <li key={creator.userId} className="flex items-center gap-4 p-4">
                  <RankBullet rank={index + 1} />
                  <Avatar url={creator.avatarUrl} name={creator.name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {creator.name}
                      {creator.userId === current?.user.id && (
                        <span className="ml-2 text-xs font-normal text-zinc-500">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {creator.generationCount} {creator.generationCount === 1 ? "photo" : "photos"}
                    </p>
                  </div>
                  <span className="text-xl font-bold tabular-nums">{creator.totalScore}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <div className="mt-8">
          <SignInWall
            title="See the full leaderboard"
            message="Sign in with Google to see every top caption, the top creators and where you rank."
          />
        </div>
      )}
    </main>
  );
}
