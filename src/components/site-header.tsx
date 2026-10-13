import Link from "next/link";
import { signOut } from "@/app/profile/actions";
import { Avatar } from "@/components/avatar";
import { LineBullet } from "@/components/line-bullet";
import { getCurrentUser } from "@/lib/profile";

const linkClass = "text-sm font-bold text-zinc-300 hover:text-white";

export async function SiteHeader() {
  const current = await getCurrentUser();

  return (
    <header className="bg-black text-white">
      <div className="mx-auto w-full max-w-3xl px-6 pt-2 pb-3">
        <div className="mb-3 h-[3px] bg-white" aria-hidden />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-1.5 font-bold tracking-tight">
            <LineBullet color="#EE352E">H</LineBullet>
            <LineBullet color="#FCCC0A" textColor="#000000">
              P
            </LineBullet>
            <span className="ml-1 text-lg">Humor Project</span>
          </Link>

          <nav className="flex flex-wrap items-center gap-4">
            <Link href="/leaderboard" className={linkClass}>
              Leaderboard
            </Link>
            {current ? (
              <>
                <Link href="/dashboard" className={linkClass}>
                  My stuff
                </Link>
                <Link href="/profile" className={`${linkClass} flex items-center gap-2`}>
                  <Avatar url={current.avatarUrl} name={current.displayName} size={26} />
                  Profile
                </Link>
                <form action={signOut}>
                  <button type="submit" className={linkClass}>
                    Sign out
                  </button>
                </form>
                <Link
                  href="/create"
                  className="rounded-full bg-white px-3 py-1 text-sm font-bold text-black hover:bg-zinc-200"
                >
                  + Create
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-white px-3 py-1 text-sm font-bold text-black hover:bg-zinc-200"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
