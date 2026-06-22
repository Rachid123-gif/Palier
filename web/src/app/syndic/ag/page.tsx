import { PageHeader, Card, KpiCard } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { longDate } from "@/lib/format";

const agenda = [
  "Approbation des comptes 2025",
  "Vote du budget 2026",
  "Rénovation du hall d'entrée (devis 78 000 MAD)",
  "Questions diverses",
];

const votes = [
  { q: "Approuver le devis de rénovation du hall (78 000 MAD)", pour: 58, contre: 22, abst: 20 },
  { q: "Reconduction du contrat de gardiennage", pour: 81, contre: 9, abst: 10 },
];

export default function SyndicAg() {
  return (
    <div className="animate-[fade_0.3s_ease]">
      <PageHeader
        title="Assemblées & votes"
        subtitle="Organisez l'AG, suivez le quorum et les résultats pondérés par tantièmes"
        action={
          <button className="tap inline-flex items-center gap-2 rounded-full bg-palier-600 px-4 py-2.5 text-sm font-semibold text-white">
            <Icon name="CalendarPlus" className="h-4 w-4" /> Convoquer une AG
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard icon="CalendarDays" label="Prochaine AG" value="12 mai" tint="bg-palier-100" color="text-palier-600" hint={longDate("2026-05-12")} />
        <KpiCard icon="Users" label="Quorum atteint" value="68%" tint="bg-success-soft" color="text-success" hint="présents + pouvoirs" />
        <KpiCard icon="Vote" label="Votes ouverts" value="2" tint="bg-info-soft" color="text-info" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-[16px] font-bold text-ink">Ordre du jour — AG 2026</h2>
          <ol className="space-y-2">
            {agenda.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-palier-100 text-[12px] font-bold text-palier-700">{i + 1}</span>
                <span className="pt-1 text-[14px] text-ink">{a}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <h2 className="mb-3 text-[16px] font-bold text-ink">Résultats des votes (tantièmes)</h2>
          <div className="space-y-4">
            {votes.map((v, i) => (
              <div key={i}>
                <p className="mb-1.5 text-[13px] font-semibold text-ink">{v.q}</p>
                <div className="flex h-3 overflow-hidden rounded-full bg-sand">
                  <div style={{ width: `${v.pour}%` }} className="bg-success" />
                  <div style={{ width: `${v.contre}%` }} className="bg-danger" />
                  <div style={{ width: `${v.abst}%` }} className="bg-ink-faint/40" />
                </div>
                <div className="mt-1 flex gap-3 text-[11px] text-ink-soft">
                  <span className="text-success">Pour {v.pour}%</span>
                  <span className="text-danger">Contre {v.contre}%</span>
                  <span>Abstention {v.abst}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
