import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { ReactionBar } from "@/components/reaction-bar";
import { cardClass } from "@/components/ui";
import type { Generation } from "@/lib/feed";
import type { ReactionId } from "@/lib/reactions";
import { getVibe } from "@/lib/vibes";

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

export function VibeBadge({ vibeId }: { vibeId: string }) {
  const vibe = getVibe(vibeId);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
      style={{ backgroundColor: vibe.color, color: vibe.id === "dad" ? "#000" : "#fff" }}
    >
      <span aria-hidden>{vibe.emoji}</span>
      {vibe.label}
    </span>
  );
}

type GenerationCardProps = {
  generation: Generation;
  myVotes: Map<string, ReactionId>;
  signedIn: boolean;
  // Link the photo to its own page (off on that page itself).
  linkToPage?: boolean;
  // Show only the best N captions (used for the signed-out teaser).
  captionLimit?: number;
  actions?: ReactNode;
};

export function GenerationCard({
  generation,
  myVotes,
  signedIn,
  linkToPage = true,
  captionLimit,
  actions,
}: GenerationCardProps) {
  const captions = generation.captions.slice(0, captionLimit);

  const photo = (
    <div className="relative aspect-[4/3] w-full bg-black">
      <Image
        src={generation.imageUrl}
        alt={generation.context ?? "Uploaded photo"}
        fill
        unoptimized
        sizes="(min-width: 768px) 672px, 100vw"
        className="object-contain"
      />
    </div>
  );

  return (
    <article className={`${cardClass} overflow-hidden`}>
      <header className="flex items-center justify-between gap-3 bg-black px-4 py-2.5 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar url={generation.creator.avatarUrl} name={generation.creator.name} size={28} />
          <span className="truncate text-sm font-bold">{generation.creator.name}</span>
          <span className="hidden shrink-0 text-xs text-zinc-400 sm:inline">
            {formatDate(generation.createdAt)}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <VibeBadge vibeId={generation.vibe} />
          {actions}
        </div>
      </header>

      {linkToPage ? (
        <Link href={`/p/${generation.id}`} aria-label="Open this photo's page">
          {photo}
        </Link>
      ) : (
        photo
      )}

      {generation.context && (
        <p className="border-b-2 border-line px-4 py-2 text-sm italic text-zinc-600 dark:text-zinc-400">
          “{generation.context}”
        </p>
      )}

      <ol className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {captions.map((caption, index) => (
          <li key={caption.id} className="space-y-2 px-4 py-3">
            <p className="font-medium leading-snug">
              {index === 0 && caption.score > 0 && (
                <span className="mr-2 inline-block rounded-full bg-mta-orange px-2 py-0.5 align-middle text-xs font-bold text-white">
                  Top
                </span>
              )}
              {caption.text}
            </p>
            <ReactionBar
              captionId={caption.id}
              counts={caption.counts}
              myReaction={myVotes.get(caption.id) ?? null}
              signedIn={signedIn}
            />
          </li>
        ))}
      </ol>
    </article>
  );
}
