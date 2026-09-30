import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Humor Project",
};

const headingClass = "mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-50";
const textClass = "mt-2 text-zinc-600 dark:text-zinc-400";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Privacy Policy
      </h1>
      <p className={textClass}>Last updated: September 30, 2026</p>

      <p className={textClass}>
        Humor Project is a student project that shows a list of jokes and lets
        people sign in to set up a simple profile. This page explains what
        information the app collects and how it is used.
      </p>

      <h2 className={headingClass}>Information we collect</h2>
      <ul className={`${textClass} list-disc space-y-1 pl-6`}>
        <li>
          <strong>From Google sign-in:</strong> your email address and basic
          Google account information (such as your name), used only to sign
          you in.
        </li>
        <li>
          <strong>Profile details you enter:</strong> your first and last name.
        </li>
        <li>
          <strong>Profile photo:</strong> if you upload one, the image is stored
          in file storage and linked to your profile.
        </li>
      </ul>

      <h2 className={headingClass}>How we use it</h2>
      <p className={textClass}>
        Your information is used only to sign you in, greet you by name, and
        show your profile photo inside the app. We don&apos;t sell or share your
        information, and we don&apos;t use it for advertising.
      </p>

      <h2 className={headingClass}>Where it is stored</h2>
      <p className={textClass}>
        Account details, profile information and photos are stored with
        Supabase, and the app is hosted on Vercel. Profile photos are stored at
        a public web address so they can be displayed in the app.
      </p>

      <h2 className={headingClass}>Deleting your data</h2>
      <p className={textClass}>
        You can change your name or replace your photo at any time on your
        Profile page. To have your account and all its data deleted, contact
        the project owner through the{" "}
        <a
          href="https://github.com/meifactor/humor-project"
          className="font-medium text-zinc-900 underline dark:text-zinc-50"
        >
          project&apos;s GitHub page
        </a>
        .
      </p>
    </main>
  );
}
