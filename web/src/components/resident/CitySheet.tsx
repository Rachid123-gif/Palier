"use client";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";
import { cities } from "@/lib/data";

export function CitySheet({
  open, onClose, current, onPick,
}: {
  open: boolean;
  onClose: () => void;
  current: string;
  onPick: (slug: string) => void;
}) {
  const [detecting, setDetecting] = useState(false);

  function detect() {
    setDetecting(true);
    const finish = () => {
      // Démo : on retombe sur Casablanca (mapping lat/lng → ville en V2).
      setDetecting(false);
      onPick("casablanca");
      onClose();
    };
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(finish, finish, { timeout: 4000 });
    } else {
      setTimeout(finish, 800);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Choisir ma ville">
      <button
        onClick={detect}
        className="tap mb-3 flex w-full items-center gap-3 rounded-2xl bg-palier-600 p-3.5 text-white"
      >
        <Icon name={detecting ? "LoaderCircle" : "LocateFixed"} className={`h-5 w-5 ${detecting ? "animate-spin" : ""}`} />
        <span className="text-sm font-semibold">{detecting ? "Détection en cours…" : "Détection automatique"}</span>
      </button>
      <div className="space-y-1.5">
        {cities.map((c) => {
          const active = c.slug === current;
          return (
            <button
              key={c.slug}
              onClick={() => { onPick(c.slug); onClose(); }}
              className={`tap flex w-full items-center gap-3 rounded-2xl border p-3.5 ${active ? "border-palier-300 bg-palier-50" : "border-black/5 bg-white"}`}
            >
              <Icon name="MapPin" className="h-5 w-5 text-coral-500" />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-ink">{c.name}</p>
                <p className="text-[12px] text-ink-faint">{c.providerCount} prestataires</p>
              </div>
              {active && <Icon name="Check" className="h-5 w-5 text-palier-600" strokeWidth={2.6} />}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
