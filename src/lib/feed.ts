import type { SupabaseClient } from "@supabase/supabase-js";
import { AVATAR_BUCKET, UPLOADS_BUCKET } from "@/lib/buckets";
import type { ReactionCounts, ReactionId } from "@/lib/reactions";
import { createClient } from "@/lib/supabase/server";
import type { VibeId } from "@/lib/vibes";

export type Caption = {
  id: string;
  text: string;
  position: number;
  counts: ReactionCounts;
  score: number;
};

export type Creator = {
  name: string;
  avatarUrl: string | null;
};

export type Generation = {
  id: string;
  userId: string;
  imageUrl: string;
  imagePath: string;
  context: string | null;
  vibe: VibeId;
  createdAt: string;
  creator: Creator;
  captions: Caption[]; // highest score first
};

export type TopCaption = Caption & {
  createdAt: string;
  generationId: string;
  imageUrl: string;
  creator: Creator;
};

export type CreatorStanding = Creator & {
  userId: string;
  generationCount: number;
  totalScore: number;
};


type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
} | null;

type CaptionRow = {
  id: string;
  text: string;
  position: number;
  dead_count: number;
  funny_count: number;
  cringe_count: number;
  huh_count: number;
  score: number;
};

type GenerationRow = {
  id: string;
  user_id: string;
  image_path: string;
  context: string | null;
  vibe: VibeId;
  created_at: string;
  profiles: ProfileRow;
  captions: CaptionRow[];
};

const CAPTION_COLUMNS =
  "id, text, position, dead_count, funny_count, cringe_count, huh_count, score";

const GENERATION_COLUMNS = `id, user_id, image_path, context, vibe, created_at, profiles(first_name, last_name, avatar_path), captions(${CAPTION_COLUMNS})`;

const DAY_MS = 24 * 60 * 60 * 1000;

function publicUrl(supabase: SupabaseClient, bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function toCreator(supabase: SupabaseClient, profile: ProfileRow): Creator {
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  return {
    name: name || "Anonymous",
    avatarUrl: profile?.avatar_path
      ? publicUrl(supabase, AVATAR_BUCKET, profile.avatar_path)
      : null,
  };
}

function toCaption(row: CaptionRow): Caption {
  return {
    id: row.id,
    text: row.text,
    position: row.position,
    score: row.score,
    counts: {
      dead: row.dead_count,
      funny: row.funny_count,
      cringe: row.cringe_count,
      huh: row.huh_count,
    },
  };
}

function byScore(a: Caption, b: Caption) {
  return b.score - a.score || a.position - b.position;
}

function toGeneration(supabase: SupabaseClient, row: GenerationRow): Generation {
  return {
    id: row.id,
    userId: row.user_id,
    imagePath: row.image_path,
    imageUrl: publicUrl(supabase, UPLOADS_BUCKET, row.image_path),
    context: row.context,
    vibe: row.vibe,
    createdAt: row.created_at,
    creator: toCreator(supabase, row.profiles),
    captions: row.captions.map(toCaption).sort(byScore),
  };
}

function topScore(generation: Generation) {
  return generation.captions[0]?.score ?? 0;
}

export type FeedSort = "new" | "top";

type FeedOptions = { sort: FeedSort; vibe?: VibeId; limit?: number };

// "new": latest generations. "top": generations from the last 24 hours, best caption first.
export async function getFeed({ sort, vibe, limit = 30 }: FeedOptions) {
  const supabase = await createClient();
  let query = supabase
    .from("generations")
    .select(GENERATION_COLUMNS)
    .order("created_at", { ascending: false });

  if (vibe) {
    query = query.eq("vibe", vibe);
  }

  query =
    sort === "top"
      ? query.gte("created_at", new Date(Date.now() - DAY_MS).toISOString()).limit(100)
      : query.limit(limit);

  const { data, error } = await query.returns<GenerationRow[]>();
  const generations = (data ?? []).map((row) => toGeneration(supabase, row));

  if (sort === "top") {
    generations.sort((a, b) => topScore(b) - topScore(a));
  }

  return { generations: generations.slice(0, limit), error };
}

export async function getGeneration(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("generations")
    .select(GENERATION_COLUMNS)
    .eq("id", id)
    .maybeSingle<GenerationRow>();

  return data ? toGeneration(supabase, data) : null;
}

export async function getUserGenerations(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("generations")
    .select(GENERATION_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<GenerationRow[]>();

  return (data ?? []).map((row) => toGeneration(supabase, row));
}

export type LeaderboardWindow = "today" | "week" | "all";

const WINDOW_DAYS: Record<LeaderboardWindow, number | null> = {
  today: 1,
  week: 7,
  all: null,
};

type TopCaptionRow = CaptionRow & {
  created_at: string;
  generations: {
    id: string;
    image_path: string;
    profiles: ProfileRow;
  } | null;
};

export async function getTopCaptions(window: LeaderboardWindow, limit = 20) {
  const supabase = await createClient();
  let query = supabase
    .from("captions")
    .select(
      `${CAPTION_COLUMNS}, created_at, generations(id, image_path, profiles(first_name, last_name, avatar_path))`,
    )
    .gt("score", 0)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  const days = WINDOW_DAYS[window];
  if (days) {
    query = query.gte("created_at", new Date(Date.now() - days * DAY_MS).toISOString());
  }

  const { data } = await query.returns<TopCaptionRow[]>();

  return (data ?? []).flatMap((row): TopCaption[] =>
    row.generations
      ? [
          {
            ...toCaption(row),
            createdAt: row.created_at,
            generationId: row.generations.id,
            imageUrl: publicUrl(supabase, UPLOADS_BUCKET, row.generations.image_path),
            creator: toCreator(supabase, row.generations.profiles),
          },
        ]
      : [],
  );
}

type CreatorStandingRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
  generation_count: number;
  total_score: number;
};

export async function getCreatorLeaderboard(limit = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creator_leaderboard")
    .select("user_id, first_name, last_name, avatar_path, generation_count, total_score")
    .order("total_score", { ascending: false })
    .order("generation_count", { ascending: false })
    .limit(limit)
    .returns<CreatorStandingRow[]>();

  return (data ?? []).map(
    (row): CreatorStanding => ({
      ...toCreator(supabase, row),
      userId: row.user_id,
      generationCount: Number(row.generation_count),
      totalScore: Number(row.total_score),
    }),
  );
}

// The signed-in user's reactions to these captions (RLS only returns their own).
export async function getMyVotes(captionIds: string[]) {
  const votes = new Map<string, ReactionId>();
  if (captionIds.length === 0) {
    return votes;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("caption_votes")
    .select("caption_id, reaction")
    .in("caption_id", captionIds)
    .returns<{ caption_id: string; reaction: ReactionId }[]>();

  for (const row of data ?? []) {
    votes.set(row.caption_id, row.reaction);
  }
  return votes;
}

// How often the signed-in user has used each reaction (RLS only counts their own).
export async function getMyReactionCounts(): Promise<ReactionCounts> {
  const supabase = await createClient();
  const count = async (reaction: ReactionId) => {
    const { count } = await supabase
      .from("caption_votes")
      .select("caption_id", { count: "exact", head: true })
      .eq("reaction", reaction);
    return count ?? 0;
  };

  const [dead, funny, cringe, huh] = await Promise.all([
    count("dead"),
    count("funny"),
    count("cringe"),
    count("huh"),
  ]);
  return { dead, funny, cringe, huh };
}
