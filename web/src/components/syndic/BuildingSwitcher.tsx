"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { switchBuilding } from "@/lib/auth";
import type { UserBuilding } from "@/lib/queries";

export function BuildingSwitcher({
  buildings,
  currentBuildingId,
}: {
  buildings: UserBuilding[];
  currentBuildingId: string;
}) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = buildings.find((b) => b.buildingId === currentBuildingId);

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (buildings.length <= 1) {
    // Single building — just show info, no switcher
    return (
      <div className="rounded-lg bg-black/[0.03] px-2.5 py-2">
        <p className="text-[11px] font-medium text-ink-soft">Résidence</p>
        <p className="text-[13px] font-semibold text-ink">{current?.name ?? "—"}</p>
        <p className="text-[11px] text-ink-soft">{current?.city ?? ""}</p>
      </div>
    );
  }

  async function handleSwitch(buildingId: string) {
    if (buildingId === currentBuildingId || switching) return;
    setSwitching(true);
    try {
      await switchBuilding(buildingId);
      setOpen(false);
      // Full page reload to refresh all data with new building context
      window.location.href = "/syndic";
    } catch {
      setSwitching(false);
      alert("Impossible de changer d'immeuble. Veuillez réessayer.");
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg bg-black/[0.03] px-2.5 py-2 text-left transition-colors hover:bg-black/[0.06]"
      >
        <p className="text-[11px] font-medium text-ink-soft">Résidence</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-ink">{current?.name ?? "—"}</p>
            <p className="text-[11px] text-ink-soft">{current?.city ?? ""}</p>
          </div>
          <Icon
            name="ChevronsUpDown"
            className={cn("h-3.5 w-3.5 text-ink-faint transition-transform", open && "rotate-180")}
          />
        </div>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-full rounded-lg border border-black/[0.08] bg-cream-card py-1 shadow-lg">
          <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            Mes immeubles ({buildings.length})
          </p>
          {buildings.map((b) => {
            const isActive = b.buildingId === currentBuildingId;
            return (
              <button
                key={b.buildingId}
                onClick={() => handleSwitch(b.buildingId)}
                disabled={switching}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors",
                  isActive
                    ? "bg-palier-50 text-palier-700"
                    : "text-ink hover:bg-sand/50",
                  switching && "opacity-50",
                )}
              >
                <span className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                  isActive ? "bg-palier-600 text-white" : "bg-black/[0.06] text-ink-soft",
                )}>
                  {b.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium">{b.name}</p>
                  <p className="text-[10px] text-ink-soft">{b.city}</p>
                </div>
                {isActive && <Icon name="Check" className="h-3.5 w-3.5 shrink-0 text-palier-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
