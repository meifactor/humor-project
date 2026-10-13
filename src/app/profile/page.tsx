import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { NameForm } from "@/components/name-form";
import { StationSign } from "@/components/station-sign";
import { cardClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/profile";
import { updateName } from "./actions";
import { AvatarUpload } from "./avatar-upload";

const sectionClass = `${cardClass} p-6`;

export default async function ProfilePage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <StationSign as="h1" className="mt-2">
        Profile
      </StationSign>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Signed in as {current.user.email}
      </p>

      <section className={`mt-8 ${sectionClass}`}>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Photo</h2>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <Avatar url={current.avatarUrl} name={current.displayName} size={96} />
          <AvatarUpload userId={current.user.id} />
        </div>
      </section>

      <section className={`mt-6 ${sectionClass}`}>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Name</h2>
        <NameForm
          action={updateName}
          firstName={current.profile?.first_name ?? null}
          lastName={current.profile?.last_name ?? null}
          submitLabel="Save name"
        />
      </section>
    </main>
  );
}
