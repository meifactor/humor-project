// Caption reactions, styled after NYC subway line colors.
export const REACTIONS = [
  { id: "dead", emoji: "💀", label: "I'm dead", points: 2, color: "#EE352E", textColor: "#FFFFFF" },
  { id: "funny", emoji: "😂", label: "Funny", points: 1, color: "#FCCC0A", textColor: "#000000" },
  { id: "cringe", emoji: "😬", label: "Cringe", points: 0, color: "#00933C", textColor: "#FFFFFF" },
  { id: "huh", emoji: "🤨", label: "Doesn't make sense", points: -1, color: "#0039A6", textColor: "#FFFFFF" },
] as const;

export type ReactionId = (typeof REACTIONS)[number]["id"];

export type ReactionCounts = Record<ReactionId, number>;

export function isReactionId(value: unknown): value is ReactionId {
  return REACTIONS.some((reaction) => reaction.id === value);
}

export function scoreOf(counts: ReactionCounts) {
  return REACTIONS.reduce((sum, reaction) => sum + reaction.points * counts[reaction.id], 0);
}
