import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Humor Project",
  description: "Upload a photo, get AI captions, and vote on the funniest.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <footer className="mt-12 bg-black text-zinc-400">
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm">
            <span>Next stop: something funny. Stand clear of the closing doors.</span>
            <nav className="flex gap-4 font-bold">
              <Link href="/jokes" className="hover:text-white">
                Jokes
              </Link>
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
