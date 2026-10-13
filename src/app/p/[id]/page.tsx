import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerationCard } from "@/components/generation-card";
import { getGeneration, getMyVotes } from "@/lib/feed";
import { getCurrentUser } from "@/lib/profile";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function GenerationPage({ params }: PageProps<"/p/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) {
    notFound();
  }

  const generation = await getGeneration(id);
  if (!generation) {
    notFound();
  }

  const current = await getCurrentUser();
  const myVotes = current
    ? await getMyVotes(generation.captions.map((caption) => caption.id))
    : new Map();
  const isMine = current?.user.id === generation.userId;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
        ← Back to the feed
      </Link>

      {isMine && (
        <p className="mt-4 rounded-lg border border-green-300 bg-green-50 p-4 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100">
          Your captions are live! Vote for your favorite, then share the link so
          friends can vote too.
        </p>
      )}

      <div className="mt-6">
        <GenerationCard
          generation={generation}
          myVotes={myVotes}
          signedIn={Boolean(current)}
          linkToPage={false}
        />
      </div>
    </main>
  );
}
