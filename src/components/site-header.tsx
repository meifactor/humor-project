import Link from "next/link";
import { signOut } from "@/app/profile/actions";
import { Avatar } from "@/components/avatar";
import { getCurrentUser } from "@/lib/profile";

const linkClass =
  "text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50";

export async function SiteHeader() {
  const current = await getCurrentUser();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="font-semibold text-zinc-900 dark:text-zinc-50">
          Humor Project
        </Link>

        {current ? (
          <nav className="flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className={linkClass}>
              Dashboard
            </Link>
            <Link
              href="/profile"
              className={`${linkClass} flex items-center gap-2`}
            >
              <Avatar url={current.avatarUrl} name={current.displayName} size={28} />
              Profile
            </Link>
            <form action={signOut}>
              <button type="submit" className={linkClass}>
                Sign out
              </button>
            </form>
          </nav>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
