import type { Metadata } from "next";
import { StationSign } from "@/components/station-sign";

export const metadata: Metadata = {
  title: "Privacy Policy · Humor Project",
};

const headingClass = "mt-8 text-lg font-semibold text-zinc-900 dark:text-zinc-50";
const textClass = "mt-2 text-zinc-600 dark:text-zinc-400";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <StationSign as="h1" className="mt-2">
        Privacy Policy
      </StationSign>
      <p className={textClass}>Last updated: October 7, 2026</p>

      <p className={textClass}>
        Humor Project is a student project where people upload photos, get
        AI-written captions, and vote on the funniest ones. This page explains
        what information the app collects and how it is used.
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
        <li>
          <strong>Photos you upload for captions:</strong> the photo, any note you
          add, and the captions written for it. These are public: anyone using
          the app can see them, along with your name and profile photo.
        </li>
        <li>
          <strong>Votes:</strong> which captions you upvoted or downvoted. Other
          users only see vote totals, never who voted.
        </li>
      </ul>

      <h2 className={headingClass}>How we use it</h2>
      <p className={textClass}>
        Your information is used only to run the app: signing you in, showing
        your name and photo next to your posts, writing captions, and counting
        votes. We don&apos;t sell or share your information, and we don&apos;t
        use it for advertising.
      </p>

      <h2 className={headingClass}>Where it is stored</h2>
      <p className={textClass}>
        Account details, profile information and photos are stored with
        Supabase, and the app is hosted on Vercel. Photos are stored at public
        web addresses so they can be displayed in the app. To write captions,
        each uploaded photo and its note are sent to Google&apos;s Gemini AI
        service, which processes them under Google&apos;s terms.
      </p>

      <h2 className={headingClass}>Deleting your data</h2>
      <p className={textClass}>
        You can change your name or replace your photo at any time on your
        Profile page, and delete any photo you captioned on your My stuff
        page. To have your account and all its data deleted, contact the
        project owner through the{" "}
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
