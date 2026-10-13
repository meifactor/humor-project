"use client";

import { useFormStatus } from "react-dom";

export function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm("Delete this photo and its captions? Votes on it will be lost.")) {
          event.preventDefault();
        }
      }}
      className="text-sm text-zinc-500 hover:text-red-700 disabled:opacity-50 dark:hover:text-red-400"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
