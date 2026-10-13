import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { GenerationCard } from "@/components/generation-card";
import { StationSign } from "@/components/station-sign";
import { cardClass, primaryButtonClass } from "@/components/ui";
import { getMyReactionCounts, getMyVotes, getUserGenerations } from "@/lib/feed";
import { getHumorProfile } from "@/lib/humor-profile";
import { getCurrentUser } from "@/lib/profile";
import { deleteGeneration } from "./actions";
import { DeleteButton } from "./delete-button";

export const metadata: Metadata = { title: "My stuff · Humor Project" };

// Signed-in users only: the proxy redirects signed-out visitors, and this page checks again.
export default async function DashboardPage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login");
  }
  if (!current.isComplete) {
    redirect("/onboarding");
  }

  const [generations, reactionCounts] = await Promise.all([
    getUserGenerations(current.user.id),
    getMyReactionCounts(),
  ]);
  const myVotes = await getMyVotes(generations.flatMap((g) => g.captions.map((c) => c.id)));
  const profile = getHumorProfile(reactionCounts);

  const allCaptions = generations.flatMap((g) =>
    g.captions.map((caption) => ({ ...caption, generationId: g.id })),
  );
  const totalScore = allCaptions.reduce((sum, caption) => sum + caption.score, 0);
  const mostDead = allCaptions.reduce<(typeof allCaptions)[number] | null>(
    (best, caption) =>
      caption.counts.dead > 0 && (!best || caption.counts.dead > best.counts.dead) ? caption : best,
    null,
  );

  const stats = [
    { label: "Photos captioned", value: generations.length },
    { label: "Total caption score", value: totalScore },
    { label: "Reactions given", value: profile.total },
  ];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <StationSign
        as="h1"
        bullets={<Avatar url={current.avatarUrl} name={current.displayName} size={36} />}
      >
        My stuff
      </StationSign>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className={`${cardClass} p-4`}>
            <dt className="text-xs font-bold text-zinc-500">{stat.label}</dt>
            <dd className="mt-1 text-3xl font-bold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section className={`${cardClass} mt-6 p-5`}>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Your humor profile</p>
        <h2 className="mt-1 text-2xl font-bold">{profile.title}</h2>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{profile.blurb}</p>

        {profile.total > 0 && (
          <>
            <div className="mt-4 flex h-4 overflow-hidden rounded-full border-2 border-line" aria-hidden>
              {profile.breakdown.map((reaction) =>
                reaction.count > 0 ? (
                  <div
                    key={reaction.id}
                    style={{ width: `${(reaction.count / profile.total) * 100}%`, backgroundColor: reaction.color }}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
              {profile.breakdown.map((reaction) => (
                <li key={reaction.id} className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: reaction.color }}
                  />
                  {reaction.emoji} {reaction.label}: <strong>{reaction.percent}%</strong>
                </li>
              ))}
            </ul>
          </>
        )}

        {mostDead && (
          <div className="mt-5 rounded-md bg-black p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
              Your most 💀 caption · {mostDead.counts.dead} dead
            </p>
            <Link href={`/p/${mostDead.generationId}`} className="mt-1 block font-bold hover:underline">
              “{mostDead.text}”
            </Link>
          </div>
        )}
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Your photos</h2>
        <Link href="/create" className={`${primaryButtonClass} text-sm`}>
          + Caption a photo
        </Link>
      </div>

      {generations.length === 0 ? (
        <p className={`${cardClass} mt-4 p-6`}>
          You haven&apos;t captioned any photos yet. Snap something on campus or
          on the subway and{" "}
          <Link href="/create" className="font-bold underline">
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
