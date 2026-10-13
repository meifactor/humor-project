"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// value: 1 = upvote, -1 = downvote, 0 = remove my vote.
export async function vote(captionId: string, value: 1 | -1 | 0) {
  if (!UUID.test(captionId) || ![1, -1, 0].includes(value)) {
    return { error: "Invalid vote." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only signed-in users can vote; RLS also rejects votes for anyone else's user_id.
  if (!user) {
    redirect("/login");
  }

  const { error } =
    value === 0
      ? await supabase
          .from("caption_votes")
          .delete()
          .eq("user_id", user.id)
          .eq("caption_id", captionId)
      : await supabase.from("caption_votes").upsert(
          {
            user_id: user.id,
            caption_id: captionId,
            value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,caption_id" },
        );

  if (error) {
    return { error: "Your vote couldn't be saved. Please try again." };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
