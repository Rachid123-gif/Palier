import { Icon } from "@/components/ui/Icon";

/** Barre de statut iOS factice (heure, réseau, batterie) — feeling natif. */
export function StatusBar({ dark = false }: { dark?: boolean }) {
  const color = dark ? "text-white" : "text-ink";
  return (
    <div className={`safe-top flex items-center justify-between px-6 pb-1 text-[13px] font-semibold ${color}`}>
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <Icon name="SignalHigh" className="h-3.5 w-3.5" />
        <Icon name="Wifi" className="h-3.5 w-3.5" />
        <Icon name="BatteryFull" className="h-4 w-4" />
      </div>
    </div>
  );
}
