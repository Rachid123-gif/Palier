"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log only the digest (safe unique ID), not the full error message
    if (error.digest) console.error("[Palier Error]", error.digest);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="mt-4 text-[20px] font-bold text-ink">Une erreur est survenue</h1>
      <p className="mt-2 max-w-xs text-[14px] text-ink-soft">
        Quelque chose ne s&apos;est pas passé comme prévu. Veuillez réessayer.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-palier-600 px-6 py-2.5 text-[14px] font-semibold text-white"
      >
        Réessayer
      </button>
    </div>
  );
}
