"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { switchBuilding } from "@/lib/auth";
import { useData } from "@/lib/DataProvider";

export function BuildingSwitcherResident() {
  const { buildings, buildingId } = useData();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (buildings.length <= 1) return null;

  const current = buildings.find((b) => b.buildingId === buildingId);

  async function handleSwitch(id: string) {
    if (id === buildingId || switching) return;
    setSwitching(true);
    try {
      await switchBuilding(id);
      setOpen(false);
      window.location.href = "/";
    } catch {
      setSwitching(false);
      alert("Impossible de changer d'immeuble. Veuillez réessayer.");
    }
  }

  return (
    <div ref={ref} className="relative mx-4 mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-3 py-2 shadow-sm"
      >
        <Icon name="Building2" className="h-4 w-4 text-palier-600" />
        <span className="flex-1 truncate text-left text-[13px] font-medium text-ink">
          {current?.name ?? "Mon immeuble"}
        </span>
        <Icon name="ChevronsUpDown" className="h-3.5 w-3.5 text-ink-faint" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-black/[0.08] bg-cream-card py-1 shadow-lg">
          {buildings.map((b) => {
            const isActive = b.buildingId === buildingId;
            return (
              <button
                key={b.buildingId}
                onClick={() => handleSwitch(b.buildingId)}
                disabled={switching}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                  isActive ? "bg-palier-50 text-palier-700" : "text-ink hover:bg-sand/50",
                  switching && "opacity-50",
                )}
              >
                <span className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
                  isActive ? "bg-palier-600 text-white" : "bg-black/[0.06] text-ink-soft",
                )}>
                  {b.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{b.name}</p>
                  <p className="text-[11px] text-ink-soft">{b.city}</p>
                </div>
                {isActive && <Icon name="Check" className="h-4 w-4 shrink-0 text-palier-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
