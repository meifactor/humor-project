import Link from "next/link";

type TabsProps = {
  tabs: { href: string; label: string; active: boolean }[];
  label: string;
  // "light" for use on black station signs.
  variant?: "dark" | "light";
};

export function Tabs({ tabs, label, variant = "dark" }: TabsProps) {
  const activeClass =
    variant === "light"
      ? "bg-white text-black"
      : "bg-black text-white dark:bg-white dark:text-black";
  const idleClass =
    variant === "light"
      ? "text-zinc-300 hover:text-white"
      : "text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white";

  return (
    <nav aria-label={label} className="flex flex-wrap gap-1">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`rounded-full px-3 py-1 text-sm font-bold transition ${tab.active ? activeClass : idleClass}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
