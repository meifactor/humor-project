import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { VoteButtons } from "@/components/vote-buttons";
import type { Generation, Vote } from "@/lib/feed";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

type GenerationCardProps = {
  generation: Generation;
  myVotes: Map<string, Vote>;
  signedIn: boolean;
  // Link the photo to its own page (off on that page itself).
  linkToPage?: boolean;
  actions?: ReactNode;
};

export function GenerationCard({
  generation,
  myVotes,
  signedIn,
  linkToPage = true,
  actions,
}: GenerationCardProps) {
  const photo = (
    <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-950">
      <Image
        src={generation.imageUrl}
        alt={generation.context ?? "Uploaded photo"}
        fill
        unoptimized
        sizes="(min-width: 768px) 768px, 100vw"
        className="object-contain"
      />
    </div>
  );

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar url={generation.creator.avatarUrl} name={generation.creator.name} size={28} />
          <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {generation.creator.name}
          </span>
          <span className="shrink-0 text-xs text-zinc-500">· {formatDate(generation.createdAt)}</span>
        </div>
        {actions}
      </header>

      {linkToPage ? (
        <Link href={`/p/${generation.id}`} aria-label="Open this photo's page">
          {photo}
        </Link>
      ) : (
        photo
      )}

      {generation.context && (
        <p className="px-4 pt-3 text-sm italic text-zinc-600 dark:text-zinc-400">
          “{generation.context}”
        </p>
      )}

      <ol className="divide-y divide-zinc-100 px-4 py-2 dark:divide-zinc-800">
        {generation.captions.map((caption, index) => (
          <li key={caption.id} className="flex items-center justify-between gap-3 py-2.5">
            <p className="text-zinc-900 dark:text-zinc-50">
              {index === 0 && caption.score > 0 && (
                <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Top
                </span>
              )}
              {caption.text}
            </p>
            <VoteButtons
              captionId={caption.id}
              upvotes={caption.upvotes}
              downvotes={caption.downvotes}
              myVote={myVotes.get(caption.id) ?? null}
              signedIn={signedIn}
            />
          </li>
        ))}
      </ol>
    </article>
  );
}
