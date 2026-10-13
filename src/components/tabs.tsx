import Link from "next/link";

type TabsProps = {
  tabs: { href: string; label: string; active: boolean }[];
  label: string;
};

export function Tabs({ tabs, label }: TabsProps) {
  return (
    <nav aria-label={label} className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            tab.active
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
