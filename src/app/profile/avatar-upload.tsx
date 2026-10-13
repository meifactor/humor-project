"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import { secondaryButtonClass } from "@/components/ui";
import { AVATAR_BUCKET } from "@/lib/buckets";
import { createClient } from "@/lib/supabase/client";
import { saveAvatarPath, type FormState } from "./actions";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type AvatarUploadProps = {
  userId: string;
  // Where to go after a successful upload (used during onboarding).
  redirectTo?: string;
  buttonLabel?: string;
};

export function AvatarUpload({
  userId,
  redirectTo,
  buttonLabel = "Upload a new photo",
}: AvatarUploadProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<FormState>({ status: "idle" });

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setState({ status: "error", message: "Please choose a JPEG, PNG, WebP or GIF image." });
      input.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setState({ status: "error", message: "Please choose an image under 5 MB." });
      input.value = "";
      return;
    }

    setUploading(true);
    setState({ status: "idle" });

    // Upload the file to Supabase Storage from the browser; the database only stores its path.
    const extension = file.type.split("/")[1];
    const path = `${userId}/${Date.now()}.${extension}`;
    const { error } = await createClient()
      .storage.from(AVATAR_BUCKET)
      .upload(path, file, { contentType: file.type });

    if (error) {
      setState({ status: "error", message: `Upload failed: ${error.message}` });
    } else {
      const result = await saveAvatarPath(path);
      setState(result);
      if (result.status === "success" && redirectTo) {
        router.push(redirectTo);
        return;
      }
    }

    setUploading(false);
    input.value = "";
  }

  return (
    <div>
      <label className={`${secondaryButtonClass} cursor-pointer text-sm has-[:disabled]:cursor-default has-[:disabled]:opacity-60`}>
        {uploading ? "Uploading…" : buttonLabel}
        <input
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleChange}
          disabled={uploading}
          className="sr-only"
        />
      </label>
      <p className="mt-2 text-xs text-zinc-500">JPEG, PNG, WebP or GIF, up to 5 MB.</p>
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "mt-2 text-sm text-red-700 dark:text-red-400"
              : "mt-2 text-sm text-green-700 dark:text-green-400"
          }
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
