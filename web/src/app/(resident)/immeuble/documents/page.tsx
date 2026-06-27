"use client";
import Link from "next/link";
import { StatusBar } from "@/components/resident/StatusBar";
import { Icon } from "@/components/ui/Icon";
import { shortDate } from "@/lib/format";
import { useData } from "@/lib/DataProvider";

/* Documents — données statiques en attendant une table Supabase v2 */
const docs = [
  { id: "d1", title: "PV de l'AG 2025", type: "PV", date: "2025-05-14", icon: "FileText", color: "text-info", tint: "bg-info-soft" },
  { id: "d2", title: "Contrat de syndic", type: "Contrat", date: "2025-01-10", icon: "FileSignature", color: "text-palier-600", tint: "bg-palier-100" },
  { id: "d3", title: "Attestation d'assurance immeuble", type: "Assurance", date: "2026-01-05", icon: "ShieldCheck", color: "text-success", tint: "bg-success-soft" },
  { id: "d4", title: "Règlement de copropriété", type: "Règlement", date: "2024-09-01", icon: "BookOpen", color: "text-warning", tint: "bg-warning-soft" },
];

export default function DocumentsScreen() {
  const { building } = useData();

  return (
    <div className="animate-[fade_0.4s_ease] pb-4">
      <StatusBar />
      <header className="flex items-center gap-3 px-5 pb-2 pt-3">
        <Link href="/immeuble" className="tap flex h-9 w-9 items-center justify-center rounded-full bg-cream-card text-ink shadow-card">
          <Icon name="ChevronLeft" className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">Documents</h1>
          <p className="text-[13px] text-ink-soft">{building.name}</p>
        </div>
      </header>

      <div className="space-y-4 px-4 pt-1">
        {/* Info */}
        <div className="flex items-center gap-3 rounded-2xl bg-palier-50 p-3.5">
          <Icon name="FolderOpen" className="h-5 w-5 shrink-0 text-palier-600" />
          <p className="text-[12.5px] font-medium text-palier-800">
            Documents officiels de votre copropriété — PV, contrats, règlements.
          </p>
        </div>

        {docs.length > 0 ? (
          docs.map((d) => (
            <div key={d.id} className="card flex items-center gap-3 p-3.5">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${d.tint}`}>
                <Icon name={d.icon} className={`h-5 w-5 ${d.color}`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-ink">{d.title}</p>
                <p className="text-[12px] text-ink-faint">{d.type} · {shortDate(d.date)}</p>
              </div>
              <Icon name="Eye" className="h-5 w-5 text-ink-faint" />
            </div>
          ))
        ) : (
          <div className="card flex items-center gap-3 p-4">
            <Icon name="FolderOpen" className="h-5 w-5 text-ink-faint" />
            <p className="text-[13px] text-ink-soft">Aucun document disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
