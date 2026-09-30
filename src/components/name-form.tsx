"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/profile/actions";

type NameFormProps = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  firstName: string | null;
  lastName: string | null;
  submitLabel: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-300";

export function NameForm({ action, firstName, lastName, submitLabel }: NameFormProps) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" });

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          First name
          <input
            name="first_name"
            defaultValue={firstName ?? ""}
            required
            maxLength={100}
            autoComplete="given-name"
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Last name
          <input
            name="last_name"
            defaultValue={lastName ?? ""}
            required
            maxLength={100}
            autoComplete="family-name"
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {state.message && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={
              state.status === "error"
                ? "text-sm text-red-700 dark:text-red-400"
                : "text-sm text-green-700 dark:text-green-400"
            }
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
