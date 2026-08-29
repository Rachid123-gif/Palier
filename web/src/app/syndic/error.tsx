"use client";

import { Icon } from "@/components/ui/Icon";

export default function SyndicError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
        <Icon name="TriangleAlert" className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-[18px] font-bold text-ink">Erreur</h2>
      <p className="mt-2 max-w-md text-[13px] text-ink-soft">Une erreur est survenue. Veuillez réessayer.</p>
      <button
        onClick={reset}
        className="mt-5 rounded-xl bg-palier-600 px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-palier-700"
      >
        Réessayer
      </button>
    </div>
  );
}
