"use client";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";
import { cities, quartiersByCity } from "@/lib/data";
import { nearestCity } from "@/lib/useCity";

export function CitySheet({
  open, onClose, current, currentQuartier, onPick,
}: {
  open: boolean;
  onClose: () => void;
  current: string;
  currentQuartier?: string | null;
  onPick: (city: string, quartier?: string | null) => void;
}) {
  const [detecting, setDetecting] = useState(false);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string>(current);

  function detect() {
    setDetecting(true);
    const finish = (slug: string) => { setDetecting(false); onPick(slug, null); onClose(); };
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => finish(nearestCity(pos.coords.latitude, pos.coords.longitude)),
        () => finish("casablanca"),
        { timeout: 5000 },
      );
    } else {
      setTimeout(() => finish("casablanca"), 700);
    }
  }

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const query = norm(q);
  const visible = cities.filter((c) => {
    if (!query) return true;
    if (norm(c.name).includes(query)) return true;
    return (quartiersByCity[c.slug] ?? []).some((qq) => norm(qq).includes(query));
  });

  return (
    <Sheet open={open} onClose={onClose} title="Choisir ma zone">
      {/* Recherche */}
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-card">
        <Icon name="Search" className="h-4 w-4 text-ink-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une ville ou un quartier"
          className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
        />
      </div>

      <button onClick={detect} className="press mb-3 flex w-full items-center gap-3 rounded-2xl bg-palier-600 p-3.5 text-white">
        <Icon name={detecting ? "LoaderCircle" : "LocateFixed"} className={`h-5 w-5 ${detecting ? "animate-spin" : ""}`} />
        <span className="text-sm font-semibold">{detecting ? "Détection en cours…" : "Détecter ma position (GPS)"}</span>
      </button>

      <div className="space-y-2">
        {visible.map((c) => {
          const active = c.slug === current;
          const quartiers = (quartiersByCity[c.slug] ?? []).filter((qq) => !query || norm(qq).includes(query) || norm(c.name).includes(query));
          const isOpen = expanded === c.slug || !!query;
          return (
            <div key={c.slug} className={`rounded-2xl border ${active ? "border-palier-300 bg-palier-50" : "border-black/5 bg-white"}`}>
              <button
                onClick={() => { onPick(c.slug, null); setExpanded(c.slug); }}
                className="flex w-full items-center gap-3 p-3.5"
              >
                <Icon name="MapPin" className="h-5 w-5 text-coral-500" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-ink">{c.name}</p>
                  <p className="text-[12px] text-ink-faint">{c.providerCount} prestataires{active && currentQuartier ? ` · ${currentQuartier}` : ""}</p>
                </div>
                {active && !currentQuartier && <Icon name="Check" className="h-5 w-5 text-palier-600" strokeWidth={2.6} />}
                <Icon
                  name="ChevronDown"
                  className={`h-4 w-4 text-ink-faint transition-transform ${isOpen ? "rotate-180" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setExpanded(isOpen && expanded === c.slug ? "" : c.slug); }}
                />
              </button>
              {isOpen && quartiers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-3.5 pb-3.5">
                  {quartiers.map((qq) => {
                    const qa = active && currentQuartier === qq;
                    return (
                      <button
                        key={qq}
                        onClick={() => { onPick(c.slug, qq); onClose(); }}
                        className={`press rounded-full px-3 py-1.5 text-[12px] font-semibold ${qa ? "bg-palier-600 text-white" : "bg-sand text-ink-soft"}`}
                      >
                        {qq}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
