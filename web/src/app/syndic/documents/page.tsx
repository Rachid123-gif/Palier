import { PageHeader, Card } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";

const docs = [
  { title: "PV de l'AG 2025", type: "PV", date: "14 mai 2025", size: "1,2 Mo", color: "text-info", tint: "bg-info-soft" },
  { title: "Contrat de syndic", type: "Contrat", date: "10 jan. 2025", size: "640 Ko", color: "text-palier-600", tint: "bg-palier-100" },
  { title: "Attestation d'assurance immeuble", type: "Assurance", date: "5 jan. 2026", size: "320 Ko", color: "text-success", tint: "bg-success-soft" },
  { title: "Devis rénovation hall — Otis", type: "Devis", date: "2 avr. 2026", size: "980 Ko", color: "text-warning", tint: "bg-warning-soft" },
  { title: "Règlement de copropriété", type: "Règlement", date: "1 sep. 2024", size: "2,1 Mo", color: "text-coral-600", tint: "bg-coral-400/15" },
  { title: "Budget prévisionnel 2026", type: "Budget", date: "15 jan. 2026", size: "410 Ko", color: "text-info", tint: "bg-info-soft" },
];

export default function SyndicDocuments() {
  return (
    <div className="animate-[fade_0.3s_ease]">
      <PageHeader
        title="Documents"
        subtitle="Coffre-fort partagé avec les résidents"
        action={
          <button className="tap inline-flex items-center gap-2 rounded-full bg-palier-600 px-4 py-2.5 text-sm font-semibold text-white">
            <Icon name="Upload" className="h-4 w-4" /> Téléverser
          </button>
        }
      />
      <Card>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {docs.map((d) => (
            <button key={d.title} className="tap flex items-center gap-3 rounded-xl border border-black/5 bg-[#faf8f3] p-3 text-left">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${d.tint}`}><Icon name="FileText" className={`h-5 w-5 ${d.color}`} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-ink">{d.title}</p>
                <p className="text-[12px] text-ink-faint">{d.type} · {d.date} · {d.size}</p>
              </div>
              <Icon name="Download" className="h-5 w-5 text-palier-600" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
