"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";

function useCurrentTime() {
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setTime(`${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`);
    }, 10_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/** Barre de statut iOS — heure réelle, icônes réseau/batterie. */
export function StatusBar({ dark = false }: { dark?: boolean }) {
  const color = dark ? "text-white" : "text-ink";
  const time = useCurrentTime();
  return (
    <div className={`safe-top flex items-center justify-between px-6 pb-1 text-[13px] font-semibold ${color}`}>
      <span>{time}</span>
      <div className="flex items-center gap-1.5">
        <Icon name="SignalHigh" className="h-3.5 w-3.5" />
        <Icon name="Wifi" className="h-3.5 w-3.5" />
        <Icon name="BatteryFull" className="h-4 w-4" />
      </div>
    </div>
  );
}
