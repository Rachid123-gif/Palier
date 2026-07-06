"use client";

import { Icon } from "@/components/ui/Icon";

export default function ResidentError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
        <Icon name="TriangleAlert" className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-[18px] font-bold text-ink">Une erreur est survenue</h2>
      <p className="mt-2 text-[13px] text-ink-soft">{error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}</p>
      <button
        onClick={reset}
        className="mt-5 rounded-full bg-palier-600 px-6 py-2.5 text-[14px] font-semibold text-white"
      >
        Réessayer
      </button>
    </div>
  );
}
