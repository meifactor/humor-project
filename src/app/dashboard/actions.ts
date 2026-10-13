"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UPLOADS_BUCKET } from "@/lib/buckets";
import { createClient } from "@/lib/supabase/server";

export async function deleteGeneration(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS only lets owners delete; captions and votes are removed by cascade.
  const { data: deleted } = await supabase
    .from("generations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("image_path")
    .maybeSingle<{ image_path: string }>();

  if (deleted) {
    await supabase.storage.from(UPLOADS_BUCKET).remove([deleted.image_path]);
  }

  revalidatePath("/", "layout");
}
