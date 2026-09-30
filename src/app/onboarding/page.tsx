import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/profile/actions";
import { AvatarUpload } from "@/app/profile/avatar-upload";
import { Avatar } from "@/components/avatar";
import { NameForm } from "@/components/name-form";
import { getCurrentUser } from "@/lib/profile";

// Two-step sign-up: name first, then a profile photo.
export default async function OnboardingPage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login");
  }
  if (current.isComplete) {
    redirect("/dashboard");
  }

  const step = current.hasName ? 2 : 1;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
      <p className="text-sm font-medium text-zinc-500">Step {step} of 2</p>

      {step === 1 ? (
        <>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome! What&apos;s your name?
          </h1>
          <p className="mt-2 mb-8 text-zinc-600 dark:text-zinc-400">
            Add your first and last name to set up your profile. You can change
            them later on your Profile page.
          </p>
          <NameForm
            action={completeOnboarding}
            firstName={current.profile?.first_name ?? null}
            lastName={current.profile?.last_name ?? null}
            submitLabel="Continue"
          />
        </>
      ) : (
        <>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Nice to meet you, {current.profile?.first_name}! Add a photo
          </h1>
          <p className="mt-2 mb-8 text-zinc-600 dark:text-zinc-400">
            Upload a photo of yourself to finish setting up your profile. You
            can change it later on your Profile page.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Avatar url={current.avatarUrl} name={current.displayName} size={96} />
            <AvatarUpload
              userId={current.user.id}
              redirectTo="/dashboard"
              buttonLabel="Choose a photo"
            />
          </div>
        </>
      )}
    </main>
  );
}
