import { REACTIONS, type ReactionCounts, type ReactionId } from "@/lib/reactions";

const TITLES: Record<ReactionId, { title: string; blurb: string }> = {
  dead: { title: "Easily Deceased 💀", blurb: "Everything kills you. Comedians love you." },
  funny: { title: "Certified Giggler 😂", blurb: "Generous with the laughs, a true supportive friend." },
  cringe: { title: "Professional Cringe Critic 😬", blurb: "You've seen too much internet to be impressed." },
  huh: { title: "Confused Philosopher 🤨", blurb: "You need jokes to make sense. Respect." },
};

export const MIN_REACTIONS_FOR_PROFILE = 5;

export function getHumorProfile(counts: ReactionCounts) {
  const total = REACTIONS.reduce((sum, reaction) => sum + counts[reaction.id], 0);

  const breakdown = REACTIONS.map((reaction) => ({
    ...reaction,
    count: counts[reaction.id],
    percent: total ? Math.round((counts[reaction.id] / total) * 100) : 0,
  }));

  if (total < MIN_REACTIONS_FOR_PROFILE) {
    return {
      total,
      breakdown,
      title: "Fresh Rider 🚇",
      blurb: `React to ${MIN_REACTIONS_FOR_PROFILE - total} more captions to unlock your humor profile.`,
    };
  }

  if ((counts.cringe + counts.huh) / total > 0.5) {
    return {
      total,
      breakdown,
      title: "Tough Crowd 🧱",
      blurb: "Most captions don't make the cut with you. The AI is scared.",
    };
  }

  const favorite = breakdown.reduce((best, reaction) => (reaction.count > best.count ? reaction : best));
  return { total, breakdown, ...TITLES[favorite.id] };
}
