import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerationCard } from "@/components/generation-card";
import { SignInWall } from "@/components/sign-in-wall";
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
  const signedIn = Boolean(current);
  const myVotes = signedIn
    ? await getMyVotes(generation.captions.map((caption) => caption.id))
    : new Map();
  const isMine = current?.user.id === generation.userId;
  const hiddenCount = generation.captions.length - 1;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <Link href="/" className="text-sm font-bold text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white">
        ← Back to the feed
      </Link>

      {isMine && (
        <p className="mt-4 rounded-md border-2 border-mta-green bg-mta-green/10 p-4 font-medium">
          Your captions are live! React to your favorite, then share the link so
          friends can weigh in.
        </p>
      )}

      <div className="mt-6">
        {/* Signed-out visitors only get the best caption; the rest is behind sign-in. */}
        <GenerationCard
          generation={generation}
          myVotes={myVotes}
          signedIn={signedIn}
          linkToPage={false}
          captionLimit={signedIn ? undefined : 1}
        />
      </div>

      {!signedIn && hiddenCount > 0 && (
        <div className="mt-8">
          <SignInWall
            title={`${hiddenCount} more captions`}
            message="Sign in with Google to see every caption on this photo, react to them and caption your own photos."
          />
        </div>
      )}
    </main>
  );
}
