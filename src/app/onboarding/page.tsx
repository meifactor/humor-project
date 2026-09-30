import { redirect } from "next/navigation";
import { completeOnboarding } from "@/app/profile/actions";
import { NameForm } from "@/components/name-form";
import { getCurrentUser } from "@/lib/profile";

// Sign-up step 1: name (required). Step 2 is the optional photo at /onboarding/photo.
export default async function OnboardingPage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login");
  }
  if (current.isComplete) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
      <p className="text-sm font-medium text-zinc-500">Step 1 of 2</p>
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
    </main>
  );
}
