import Link from "next/link";
import { GenerationCard } from "@/components/generation-card";
import { LineBullet } from "@/components/line-bullet";
import { SignInWall } from "@/components/sign-in-wall";
import { StationSign } from "@/components/station-sign";
import { Tabs } from "@/components/tabs";
import { primaryButtonClass } from "@/components/ui";
import { getFeed, getMyVotes, type FeedSort } from "@/lib/feed";
import { getCurrentUser } from "@/lib/profile";
import { REACTIONS } from "@/lib/reactions";
import { isVibeId, VIBES, type VibeId } from "@/lib/vibes";

// Signed-out visitors get a short preview, then the sign-in wall.
const PREVIEW_COUNT = 3;

function feedHref(sort: FeedSort, vibe: VibeId | undefined) {
  const params = new URLSearchParams();
  if (sort === "top") params.set("sort", "top");
  if (vibe) params.set("vibe", vibe);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const { sort: sortParam, vibe: vibeParam } = await searchParams;
  const current = await getCurrentUser();
  const signedIn = Boolean(current);

  // Sorting and filtering are for signed-in users; everyone else sees the newest few.
  const sort: FeedSort = signedIn && sortParam === "top" ? "top" : "new";
  const vibe = signedIn && isVibeId(vibeParam) ? vibeParam : undefined;

  const { generations, error } = await getFeed({
    sort,
    vibe,
    limit: signedIn ? 30 : PREVIEW_COUNT,
  });
  const myVotes = signedIn
    ? await getMyVotes(generations.flatMap((g) => g.captions.map((c) => c.id)))
    : new Map();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      {current && !current.isComplete && (
        <p className="mb-6 rounded-md border-2 border-mta-yellow bg-mta-yellow/15 p-4 font-medium">
          Your profile is missing your name.{" "}
          <Link href="/onboarding" className="font-bold underline">
            Add your first and last name
          </Link>
        </p>
      )}

      <section className="rounded-md bg-black px-6 pt-3 pb-7 text-white">
        <div className="mb-5 h-[3px] bg-white" aria-hidden />
        <div className="flex gap-1.5">
          {REACTIONS.map((reaction) => (
            <LineBullet key={reaction.id} color={reaction.color} textColor={reaction.textColor} size={34}>
              {reaction.emoji}
            </LineBullet>
          ))}
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">116 St – Caption the City</h1>
        <p className="mt-3 max-w-lg text-zinc-300">
          Snap something on campus, the subway or your weekend in NYC. AI writes
          the captions. Everyone decides if they&apos;re 💀, 😂, 😬 or 🤨.
        </p>
        <Link
          href={signedIn ? "/create" : "/login"}
          className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 font-bold text-black hover:bg-zinc-200"
        >
          {signedIn ? "+ Caption a photo" : "Sign in to start"}
        </Link>
      </section>

      <StationSign
        className="mt-8"
        aside={
          signedIn && (
            <Tabs
              label="Sort the feed"
              variant="light"
              tabs={[
                { href: feedHref("new", vibe), label: "New", active: sort === "new" },
                { href: feedHref("top", vibe), label: "Top today", active: sort === "top" },
              ]}
            />
          )
        }
      >
        {sort === "top" ? "Top today" : "Now arriving"}
      </StationSign>

      {signedIn && (
        <nav aria-label="Filter by vibe" className="mt-3 flex flex-wrap gap-1.5">
          <Link
            href={feedHref(sort, undefined)}
            aria-current={!vibe ? "page" : undefined}
            className={`rounded-full border-2 border-line px-3 py-1 text-sm font-bold ${
              !vibe ? "bg-black text-white dark:bg-white dark:text-black" : ""
            }`}
          >
            All vibes
          </Link>
          {VIBES.map((v) => (
            <Link
              key={v.id}
              href={feedHref(sort, v.id)}
              aria-current={vibe === v.id ? "page" : undefined}
              className="rounded-full border-2 px-3 py-1 text-sm font-bold"
              style={
                vibe === v.id
                  ? { backgroundColor: v.color, borderColor: v.color, color: v.id === "dad" ? "#000" : "#fff" }
                  : { borderColor: v.color }
              }
            >
              {v.emoji} {v.label}
            </Link>
          ))}
        </nav>
      )}

      {error ? (
        <p className="mt-6 rounded-md border-2 border-mta-red p-4 font-medium text-mta-red">
          Could not load the feed: {error.message}
        </p>
      ) : generations.length === 0 ? (
        <div className="mt-6 rounded-md border-2 border-dashed border-line p-6 text-center">
          <p className="font-medium">
            {sort === "top"
              ? "Nothing posted in the last 24 hours yet."
              : vibe
                ? "No photos with this vibe yet."
                : "No photos yet."}
          </p>
          {signedIn && (
            <Link href="/create" className={`${primaryButtonClass} mt-4`}>
              Be the first: caption a photo
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {generations.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              myVotes={myVotes}
              signedIn={signedIn}
            />
          ))}
        </div>
      )}

      {!signedIn && (
        <div className="mt-8">
          <SignInWall />
        </div>
      )}
    </main>
  );
}
