import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { Icon } from "@/components/ui/Icon";
import { shortDate } from "@/lib/format";

const docs = [
  { id: "d1", title: "PV de l'AG 2025", type: "PV", date: "2025-05-14", size: "1,2 Mo", color: "text-info", tint: "bg-info-soft" },
  { id: "d2", title: "Contrat de syndic", type: "Contrat", date: "2025-01-10", size: "640 Ko", color: "text-palier-600", tint: "bg-palier-100" },
  { id: "d3", title: "Attestation d'assurance immeuble", type: "Assurance", date: "2026-01-05", size: "320 Ko", color: "text-success", tint: "bg-success-soft" },
  { id: "d4", title: "Devis rénovation hall — Otis", type: "Devis", date: "2026-04-02", size: "980 Ko", color: "text-warning", tint: "bg-warning-soft" },
  { id: "d5", title: "Règlement de copropriété", type: "Règlement", date: "2024-09-01", size: "2,1 Mo", color: "text-coral-600", tint: "bg-coral-400/15" },
];

export default function DocumentsScreen() {
  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />
      <header className="flex items-center gap-3 px-5 pb-2 pt-3">
        <Link href="/immeuble" className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
          <Icon name="ChevronLeft" className="h-5 w-5" />
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Documents</h1>
      </header>

      <div className="space-y-3 px-4 pt-1">
        {docs.map((d) => (
          <button key={d.id} className="tap card flex w-full items-center gap-3 p-3.5 text-left">
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${d.tint}`}>
              <Icon name="FileText" className={`h-5 w-5 ${d.color}`} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-ink">{d.title}</p>
              <p className="text-[12px] text-ink-faint">{d.type} · {shortDate(d.date)} · {d.size}</p>
            </div>
            <Icon name="Download" className="h-5 w-5 text-palier-600" />
          </button>
        ))}
      </div>
    </div>
  );
}
