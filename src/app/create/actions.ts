"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UPLOADS_BUCKET } from "@/lib/buckets";
import { finishRequest, runCaptionPipeline } from "@/lib/caption-pipeline";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isVibeId } from "@/lib/vibes";

const DAILY_LIMIT = 10;
const MAX_CONTEXT_LENGTH = 200;
const MIME_TYPES: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function createGeneration(
  path: string,
  rawContext: string,
  vibe: string,
): Promise<{ error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Only accept photos the user just uploaded to their own folder.
  const match = path.match(new RegExp(`^${user.id}/\\d+\\.(jpeg|png|webp|gif)$`));
  if (!match) {
    return { error: "Invalid photo. Please upload it again." };
  }

  if (!isVibeId(vibe)) {
    return { error: "Please pick a caption vibe." };
  }

  const removeUpload = () => supabase.storage.from(UPLOADS_BUCKET).remove([path]);

  const context = rawContext.trim().slice(0, MAX_CONTEXT_LENGTH) || null;

  // Rate limit to protect the free AI quota.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);

  if ((count ?? 0) >= DAILY_LIMIT) {
    await removeUpload();
    return {
      error: `You've hit today's limit of ${DAILY_LIMIT} photos. Come back tomorrow, or go vote on other people's captions!`,
    };
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(UPLOADS_BUCKET)
    .download(path);

  if (downloadError || !file) {
    return { error: "We couldn't read your photo. Please upload it again." };
  }

  // The server reads the prompt chain config and logs the request with the service role;
  // users have no access to those tables, nor insert access to generations or captions.
  const admin = createAdminClient();
  let result: Awaited<ReturnType<typeof runCaptionPipeline>>;
  try {
    result = await runCaptionPipeline({
      db: admin,
      image: {
        base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
        mimeType: MIME_TYPES[match[1]],
      },
      vibe,
      context,
      userId: user.id,
      imagePath: path,
      source: "app",
    });
  } catch (error) {
    console.error("Caption generation failed", error);
    await removeUpload();
    return {
      error: "The caption AI is busy or couldn't read that photo. Please try again in a minute.",
    };
  }

  const fail = async (message: string) => {
    await finishRequest(admin, result.requestId, result.started, { status: "failed", error: message });
    await removeUpload();
    return { error: "We couldn't save your captions. Please try again." };
  };

  const { data: generation, error: generationError } = await admin
    .from("generations")
    .insert({
      user_id: user.id,
      image_path: path,
      context,
      vibe,
      prompt: result.prompt,
      model: result.model,
    })
    .select("id")
    .single<{ id: string }>();

  if (generationError || !generation) {
    console.error("Saving generation failed", generationError);
    return fail(`Saving generation failed: ${generationError?.message}`);
  }

  const { error: captionsError } = await admin.from("captions").insert(
    result.captions.map((text, position) => ({
      generation_id: generation.id,
      text,
      position,
    })),
  );

  if (captionsError) {
    console.error("Saving captions failed", captionsError);
    await admin.from("generations").delete().eq("id", generation.id);
    return fail(`Saving captions failed: ${captionsError.message}`);
  }

  await finishRequest(admin, result.requestId, result.started, {
    status: "succeeded",
    generationId: generation.id,
  });

  revalidatePath("/", "layout");
  redirect(`/p/${generation.id}`);
}
