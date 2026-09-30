import Image from "next/image";

type AvatarProps = {
  url: string | null;
  name: string;
  size?: number;
};

export function Avatar({ url, name, size = 32 }: AvatarProps) {
  if (url) {
    return (
      <Image
        src={url}
        alt={`${name}'s photo`}
        width={size}
        height={size}
        // Photos are served straight from Supabase Storage's public URL.
        unoptimized
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
