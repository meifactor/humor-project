import { GoogleSignInButton } from "@/app/login/google-sign-in-button";
import { LineBullet } from "@/components/line-bullet";
import { cardClass } from "@/components/ui";
import { REACTIONS } from "@/lib/reactions";

type SignInWallProps = {
  title?: string;
  message?: string;
};

// Shown to signed-out visitors after the free preview. The blurred cards behind it are
// placeholders, not real posts, so nothing extra is sent to signed-out browsers.
export function SignInWall({
  title = "Sign in to see more",
  message = "Sign in with Google to see the full feed, react to captions and caption your own photos.",
}: SignInWallProps) {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none space-y-6 blur-sm select-none">
        {[0, 1].map((i) => (
          <div key={i} className={`${cardClass} overflow-hidden`}>
            <div className="h-11 bg-black" />
            <div className="aspect-[4/3] bg-zinc-300 dark:bg-zinc-700" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 rounded bg-zinc-300 dark:bg-zinc-700" />
              <div className="flex gap-1.5">
                {REACTIONS.map((reaction) => (
                  <div
                    key={reaction.id}
                    className="h-6 w-12 rounded-full border-2"
                    style={{ borderColor: reaction.color }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 flex items-start justify-center px-4 pt-16">
        <div className="w-full max-w-sm overflow-hidden rounded-md bg-black text-white shadow-2xl">
          <div className="px-5 pt-3 pb-5">
            <div className="mb-4 h-[3px] bg-white" aria-hidden />
            <div className="flex gap-1.5">
              {REACTIONS.map((reaction) => (
                <LineBullet key={reaction.id} color={reaction.color} textColor={reaction.textColor}>
                  {reaction.emoji}
                </LineBullet>
              ))}
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight">🔒 {title}</h2>
            <p className="mt-2 text-sm text-zinc-300">{message}</p>
            <div className="mt-5">
              <GoogleSignInButton variant="light" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
