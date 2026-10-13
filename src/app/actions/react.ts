"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isReactionId, type ReactionId } from "@/lib/reactions";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Set the signed-in user's reaction to a caption, or remove it with null.
export async function react(captionId: string, reaction: ReactionId | null) {
  if (!UUID.test(captionId) || (reaction !== null && !isReactionId(reaction))) {
    return { error: "Invalid reaction." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only signed-in users can react; RLS also rejects rows for anyone else's user_id.
  if (!user) {
    redirect("/login");
  }

  const { error } =
    reaction === null
      ? await supabase
          .from("caption_votes")
          .delete()
          .eq("user_id", user.id)
          .eq("caption_id", captionId)
      : await supabase.from("caption_votes").upsert(
          {
            user_id: user.id,
            caption_id: captionId,
            reaction,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,caption_id" },
        );

  if (error) {
    return { error: "Your reaction couldn't be saved. Please try again." };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
