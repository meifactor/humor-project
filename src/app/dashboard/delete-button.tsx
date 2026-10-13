"use client";

import { useFormStatus } from "react-dom";

export function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm("Delete this photo and its captions? Reactions on it will be lost.")) {
          event.preventDefault();
        }
      }}
      className="text-sm font-bold text-zinc-400 hover:text-red-400 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
