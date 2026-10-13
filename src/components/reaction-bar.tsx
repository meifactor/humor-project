"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { react } from "@/app/actions/react";
import { REACTIONS, type ReactionCounts, type ReactionId } from "@/lib/reactions";

type ReactionBarProps = {
  captionId: string;
  counts: ReactionCounts;
  myReaction: ReactionId | null;
  signedIn: boolean;
};

type ReactionState = { myReaction: ReactionId | null; counts: ReactionCounts };

function applyReaction(state: ReactionState, next: ReactionId | null): ReactionState {
  const counts = { ...state.counts };
  if (state.myReaction) counts[state.myReaction] -= 1;
  if (next) counts[next] += 1;
  return { myReaction: next, counts };
}

const pillClass =
  "inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-sm font-bold tabular-nums transition disabled:opacity-60";

export function ReactionBar({ captionId, counts, myReaction, signedIn }: ReactionBarProps) {
  const [state, setOptimisticReaction] = useOptimistic({ myReaction, counts }, applyReaction);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function choose(reaction: ReactionId) {
    // Picking your current reaction again removes it.
    const next = state.myReaction === reaction ? null : reaction;
    setError(null);
    startTransition(async () => {
      setOptimisticReaction(next);
      const result = await react(captionId, next);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {REACTIONS.map((reaction) => {
          const count = state.counts[reaction.id];
          const selected = state.myReaction === reaction.id;
          const style = selected
            ? { backgroundColor: reaction.color, borderColor: reaction.color, color: reaction.textColor }
            : { borderColor: reaction.color };
          const content = (
            <>
              <span aria-hidden>{reaction.emoji}</span>
              <span>{count}</span>
            </>
          );

          return signedIn ? (
            <button
              key={reaction.id}
              type="button"
              onClick={() => choose(reaction.id)}
              disabled={pending}
              aria-pressed={selected}
              aria-label={`${reaction.label} (${count})`}
              title={reaction.label}
              className={`${pillClass} ${selected ? "" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
              style={style}
            >
              {content}
            </button>
          ) : (
            <Link
              key={reaction.id}
              href="/login"
              aria-label={`${reaction.label} (${count}). Sign in to react`}
              title={`${reaction.label} · sign in to react`}
              className={`${pillClass} hover:bg-black/5 dark:hover:bg-white/10`}
              style={style}
            >
              {content}
            </Link>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
