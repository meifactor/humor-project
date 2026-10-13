import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StationSign } from "@/components/station-sign";
import { getCurrentUser } from "@/lib/profile";
import { CreateForm } from "./create-form";

export const metadata: Metadata = { title: "Caption a photo · Humor Project" };

// Caption generation may try up to 5 AI models (20 seconds each) when Gemini is busy.
export const maxDuration = 120;

export default async function CreatePage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login");
  }
  if (!current.isComplete) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-8">
      <StationSign as="h1">Caption a photo</StationSign>
      <p className="mt-3 mb-8 text-zinc-600 dark:text-zinc-400">
        Upload a photo, pick a vibe, and AI writes 5 captions. Everyone then
        reacts 💀 😂 😬 🤨. Photos are public, so skip anything private.
      </p>
      <CreateForm userId={current.user.id} />
    </main>
  );
}
