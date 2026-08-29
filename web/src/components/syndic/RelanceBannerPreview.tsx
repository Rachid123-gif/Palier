"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { useLang } from "@/lib/LangProvider";

export function RelanceBannerPreview({
  hasCustomMessage,
  customMessage,
}: {
  hasCustomMessage: boolean;
  customMessage: string | null;
}) {
  const { i } = useLang();
  const B = i.syndic.recouvrement.banner;
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
      <div className="flex items-start gap-2">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <div className="flex-1">
          <p className="text-[12px] text-ink-soft">
            {B.info}{" "}
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-0.5 font-medium text-palier-700 hover:text-palier-800"
            >
              {open ? B.hide : B.showDefault}
              <Icon
                name="ChevronDown"
                className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
                strokeWidth={2}
              />
            </button>
          </p>

          {open && (
            <div className="mt-3 rounded-lg border border-black/[0.06] bg-cream px-3.5 py-3">
              {hasCustomMessage && customMessage ? (
                <>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{B.customLabel}</p>
                  <p className="whitespace-pre-line text-[12px] text-ink-soft">{customMessage}</p>
                </>
              ) : (
                <>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{B.defaultLabel}</p>
                  <div className="space-y-1.5 text-[12px] text-ink-soft">
                    <p>{B.greeting} <span className="rounded bg-palier-50 px-1 text-palier-700">{"{prénom}"}</span>,</p>
                    <p>{B.cotisationPending("{immeuble}", "{lot}")}</p>
                    <p>• {B.montantDu} : <span className="rounded bg-palier-50 px-1 text-palier-700">{"{montant}"}</span> MAD</p>
                    <p>• {B.dejaPaye} : <span className="rounded bg-palier-50 px-1 text-palier-700">{"{payé}"}</span> MAD</p>
                    <p>• {B.resteARegler} : <span className="rounded bg-palier-50 px-1 text-palier-700">{"{reste}"}</span> MAD</p>
                    <p>• {B.echeance} : <span className="rounded bg-palier-50 px-1 text-palier-700">{"{date}"}</span></p>
                    <p>{B.merciRegulariser}</p>
                  </div>
                </>
              )}
              <p className="mt-2.5 text-[11px] text-ink-faint">
                {B.customizeHint}{" "}
                <a href="/syndic/parametres" className="font-medium text-palier-700 hover:text-palier-800 underline underline-offset-2">
                  {B.parametres}
                </a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
