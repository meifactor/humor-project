import Link from "next/link";
import { redirect } from "next/navigation";
import { AvatarUpload } from "@/app/profile/avatar-upload";
import { Avatar } from "@/components/avatar";
import { getCurrentUser } from "@/lib/profile";

// Sign-up step 2: an optional profile photo.
export default async function OnboardingPhotoPage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login");
  }
  if (!current.hasName) {
    redirect("/onboarding");
  }
  if (current.hasPhoto) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
      <p className="text-sm font-medium text-zinc-500">Step 2 of 2 · Optional</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Nice to meet you, {current.profile?.first_name}! Add a photo?
      </h1>
      <p className="mt-2 mb-8 text-zinc-600 dark:text-zinc-400">
        Upload a photo of yourself so it shows on your profile. You can skip
        this and add one later on your Profile page.
      </p>
      <div className="flex flex-wrap items-center gap-6">
        <Avatar url={current.avatarUrl} name={current.displayName} size={96} />
        <AvatarUpload
          userId={current.user.id}
          redirectTo="/dashboard"
          buttonLabel="Choose a photo"
        />
      </div>
      <Link
        href="/dashboard"
        className="mt-8 inline-block text-sm font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        Skip for now
      </Link>
    </main>
  );
}
