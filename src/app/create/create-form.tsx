"use client";

import Image from "next/image";
import { useEffect, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { UPLOADS_BUCKET } from "@/lib/buckets";
import { createClient } from "@/lib/supabase/client";
import { createGeneration } from "./actions";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_CONTEXT_LENGTH = 200;

export function CreateForm({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [step, setStep] = useState<"idle" | "uploading" | "generating">("idle");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const busy = step !== "idle";

  // Free the preview's memory when it's replaced or the page is left.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.currentTarget.files?.[0] ?? null;
    setError(null);

    if (chosen && !ALLOWED_TYPES.includes(chosen.type)) {
      setError("Please choose a JPEG, PNG, WebP or GIF image.");
      return;
    }
    if (chosen && chosen.size > MAX_BYTES) {
      setError("Please choose an image under 10 MB.");
      return;
    }

    setFile(chosen);
    setPreviewUrl(chosen ? URL.createObjectURL(chosen) : null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose a photo first.");
      return;
    }

    setError(null);
    setStep("uploading");

    // The photo goes straight to Supabase Storage; only its path is sent to the server.
    const extension = file.type.split("/")[1];
    const path = `${userId}/${Date.now()}.${extension}`;
    const { error: uploadError } = await createClient()
      .storage.from(UPLOADS_BUCKET)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setStep("idle");
      return;
    }

    setStep("generating");
    startTransition(async () => {
      // On success the action redirects to the new photo's page.
      const result = await createGeneration(path, context);
      if (result?.error) {
        setError(result.error);
        setStep("idle");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-center transition hover:border-zinc-500 has-[:disabled]:cursor-default dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500">
        {previewUrl ? (
          <div className="relative aspect-[4/3] w-full">
            <Image src={previewUrl} alt="Your photo" fill unoptimized className="object-contain" />
          </div>
        ) : (
          <div className="px-6 py-16">
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Choose a photo</p>
            <p className="mt-1 text-sm text-zinc-500">JPEG, PNG, WebP or GIF, up to 10 MB</p>
          </div>
        )}
        <input
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileChange}
          disabled={busy}
          className="sr-only"
        />
      </label>
      {previewUrl && !busy && (
        <p className="-mt-4 text-center text-sm text-zinc-500">Click the photo to pick a different one.</p>
      )}

      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        What&apos;s happening? <span className="font-normal text-zinc-500">(optional)</span>
        <input
          value={context}
          onChange={(event) => setContext(event.target.value)}
          maxLength={MAX_CONTEXT_LENGTH}
          disabled={busy}
          placeholder="e.g. the 1 train at 8am before my midterm"
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-300"
        />
      </label>

      <button
        type="submit"
        disabled={busy || !file}
        className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {step === "uploading"
          ? "Uploading photo…"
          : step === "generating"
            ? "Writing captions… (this takes a few seconds)"
            : "Generate captions"}
      </button>

      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}
    </form>
  );
}
