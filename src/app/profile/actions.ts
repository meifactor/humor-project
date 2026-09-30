"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AVATAR_BUCKET } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/server";

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const MAX_NAME_LENGTH = 100;

// Every action re-checks the session: the proxy alone isn't a security boundary.
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

function readName(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

async function saveName(formData: FormData): Promise<FormState> {
  const firstName = readName(formData, "first_name");
  const lastName = readName(formData, "last_name");

  if (!firstName || !lastName) {
    return { status: "error", message: "Please enter both your first and last name." };
  }
  if (firstName.length > MAX_NAME_LENGTH || lastName.length > MAX_NAME_LENGTH) {
    return { status: "error", message: `Names must be ${MAX_NAME_LENGTH} characters or fewer.` };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    first_name: firstName,
    last_name: lastName,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { status: "error", message: `Could not save your name: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Saved." };
}

export async function updateName(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  return saveName(formData);
}

export async function completeOnboarding(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await saveName(formData);
  if (result.status === "error") {
    return result;
  }
  // Next, the optional photo step.
  redirect("/onboarding/photo");
}

// Stores only the Storage path of an already-uploaded photo, never the image itself.
export async function saveAvatarPath(path: string): Promise<FormState> {
  const { supabase, user } = await requireUser();

  // Only accept files in the user's own folder, e.g. "<user id>/1727600000000.png".
  const expectedPath = new RegExp(`^${user.id}/\\d+\\.(jpeg|png|webp|gif)$`);
  if (!expectedPath.test(path)) {
    return { status: "error", message: "Invalid photo path." };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle<{ avatar_path: string | null }>();

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    avatar_path: path,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { status: "error", message: `Could not save your photo: ${error.message}` };
  }

  // Clean up the previous photo so old uploads don't pile up in Storage.
  if (existing?.avatar_path && existing.avatar_path !== path) {
    await supabase.storage.from(AVATAR_BUCKET).remove([existing.avatar_path]);
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Photo updated." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
