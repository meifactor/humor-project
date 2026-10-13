import type { ReactNode } from "react";

type StationSignProps = {
  children: ReactNode;
  // Line bullets or other content shown before the title.
  bullets?: ReactNode;
  // Content on the right side of the sign, e.g. tabs.
  aside?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
};

// A black subway station sign with the thin white line across the top.
export function StationSign({ children, bullets, aside, as: Heading = "h2", className = "" }: StationSignProps) {
  return (
    <div className={`rounded-md bg-black px-4 pt-2 pb-3 text-white ${className}`}>
      <div className="mb-2.5 h-[3px] bg-white" aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {bullets}
          <Heading
            className={`font-bold tracking-tight ${Heading === "h1" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}
          >
            {children}
          </Heading>
        </div>
        {aside}
      </div>
    </div>
  );
}
