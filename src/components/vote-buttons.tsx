"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { vote } from "@/app/actions/vote";
import type { Vote } from "@/lib/feed";

type VoteButtonsProps = {
  captionId: string;
  upvotes: number;
  downvotes: number;
  myVote: Vote | null;
  signedIn: boolean;
};

type VoteState = { myVote: Vote | null; upvotes: number; downvotes: number };

function applyVote(state: VoteState, next: Vote | 0): VoteState {
  let { upvotes, downvotes } = state;
  if (state.myVote === 1) upvotes -= 1;
  if (state.myVote === -1) downvotes -= 1;
  if (next === 1) upvotes += 1;
  if (next === -1) downvotes += 1;
  return { myVote: next === 0 ? null : next, upvotes, downvotes };
}

const arrowClass =
  "flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none transition disabled:opacity-50";

export function VoteButtons({ captionId, upvotes, downvotes, myVote, signedIn }: VoteButtonsProps) {
  const [state, setOptimisticVote] = useOptimistic({ myVote, upvotes, downvotes }, applyVote);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const score = state.upvotes - state.downvotes;
  const tally = `${state.upvotes} up · ${state.downvotes} down`;

  if (!signedIn) {
    return (
      <Link
        href="/login"
        title="Sign in to vote"
        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      >
        <span aria-hidden>▲</span>
        <span className="min-w-6 text-center font-medium tabular-nums" title={tally}>
          {score}
        </span>
        <span aria-hidden>▼</span>
        <span className="sr-only">Sign in to vote</span>
      </Link>
    );
  }

  function cast(value: Vote) {
    // Clicking your current vote again removes it.
    const next = state.myVote === value ? 0 : value;
    setError(null);
    startTransition(async () => {
      setOptimisticVote(next);
      const result = await vote(captionId, next);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => cast(1)}
          disabled={pending}
          aria-label="Upvote"
          aria-pressed={state.myVote === 1}
          className={`${arrowClass} ${
            state.myVote === 1
              ? "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
              : "text-zinc-400 hover:bg-zinc-100 hover:text-orange-600 dark:hover:bg-zinc-800"
          }`}
        >
          ▲
        </button>
        <span
          className="min-w-6 text-center text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50"
          title={tally}
        >
          {score}
        </span>
        <button
          type="button"
          onClick={() => cast(-1)}
          disabled={pending}
          aria-label="Downvote"
          aria-pressed={state.myVote === -1}
          className={`${arrowClass} ${
            state.myVote === -1
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
              : "text-zinc-400 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800"
          }`}
        >
          ▼
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
