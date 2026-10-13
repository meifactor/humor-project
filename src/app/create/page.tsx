import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/profile";
import { CreateForm } from "./create-form";

export const metadata: Metadata = { title: "Caption a photo · Humor Project" };

export default async function CreatePage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login");
  }
  if (!current.isComplete) {
    redirect("/onboarding");
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Caption a photo
      </h1>
      <p className="mt-2 mb-8 text-zinc-600 dark:text-zinc-400">
        Upload a photo and AI will write 5 captions for it. Everyone can then
        vote on the funniest one. Photos are public, so skip anything private.
      </p>
      <CreateForm userId={current.user.id} />
    </main>
  );
}
