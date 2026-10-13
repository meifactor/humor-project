import type { SupabaseClient } from "@supabase/supabase-js";
import { AVATAR_BUCKET, UPLOADS_BUCKET } from "@/lib/buckets";
import { createClient } from "@/lib/supabase/server";

export type Caption = {
  id: string;
  text: string;
  position: number;
  upvotes: number;
  downvotes: number;
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

export type Vote = 1 | -1;

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
} | null;

type GenerationRow = {
  id: string;
  user_id: string;
  image_path: string;
  context: string | null;
  created_at: string;
  profiles: ProfileRow;
  captions: Caption[];
};

const GENERATION_COLUMNS =
  "id, user_id, image_path, context, created_at, profiles(first_name, last_name, avatar_path), captions(id, text, position, upvotes, downvotes, score)";

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
    createdAt: row.created_at,
    creator: toCreator(supabase, row.profiles),
    captions: [...row.captions].sort(byScore),
  };
}

function topScore(generation: Generation) {
  return generation.captions[0]?.score ?? 0;
}

export type FeedSort = "new" | "top";

// "new": latest generations. "top": generations from the last 24 hours, best caption first.
export async function getFeed(sort: FeedSort) {
  const supabase = await createClient();
  let query = supabase
    .from("generations")
    .select(GENERATION_COLUMNS)
    .order("created_at", { ascending: false });

  query =
    sort === "top"
      ? query.gte("created_at", new Date(Date.now() - DAY_MS).toISOString()).limit(100)
      : query.limit(30);

  const { data, error } = await query.returns<GenerationRow[]>();
  const generations = (data ?? []).map((row) => toGeneration(supabase, row));

  if (sort === "top") {
    generations.sort((a, b) => topScore(b) - topScore(a));
  }

  return { generations: generations.slice(0, 30), error };
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

type TopCaptionRow = Caption & {
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
      "id, text, position, upvotes, downvotes, score, created_at, generations(id, image_path, profiles(first_name, last_name, avatar_path))",
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
            id: row.id,
            text: row.text,
            position: row.position,
            upvotes: row.upvotes,
            downvotes: row.downvotes,
            score: row.score,
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

// The signed-in user's votes on these captions (RLS only returns their own votes).
export async function getMyVotes(captionIds: string[]) {
  const votes = new Map<string, Vote>();
  if (captionIds.length === 0) {
    return votes;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("caption_votes")
    .select("caption_id, value")
    .in("caption_id", captionIds)
    .returns<{ caption_id: string; value: Vote }[]>();

  for (const row of data ?? []) {
    votes.set(row.caption_id, row.value);
  }
  return votes;
}
