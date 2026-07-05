import Link from "next/link";
import { fetchSyndicData } from "@/lib/syndic";
import { PageHeader, KpiCard, Card, StatusPill } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { num, timeAgo, currentPeriod } from "@/lib/format";

export default async function SyndicDashboard() {
  const d = await fetchSyndicData();
  const k = d.kpis;
  const counts = {
    paid: d.recouvrement.filter((r) => r.status === "paid").length,
    partial: d.recouvrement.filter((r) => r.status === "partial").length,
    due: d.recouvrement.filter((r) => r.status === "due").length,
    late: d.recouvrement.filter((r) => r.status === "late").length,
  };
  const seg = [
    { key: "paid", label: "Payé", n: counts.paid, color: "#059669" },
    { key: "partial", label: "Partiel", n: counts.partial, color: "#2563eb" },
    { key: "due", label: "À payer", n: counts.due, color: "#d97706" },
    { key: "late", label: "En retard", n: counts.late, color: "#dc2626" },
  ];

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle={`${d.building.name} · ${currentPeriod()}`}
        action={
          <Link href="/syndic/recouvrement" className="inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-palier-700">
            Lancer le recouvrement
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Taux de recouvrement" value={`${k.rate}%`} hint={`${counts.paid} lots à jour sur ${k.lots}`} />
        <KpiCard label="Encaissé" value={num(k.collected, false)} unit="MAD" hint={`sur ${num(k.expected, false)} appelés`} />
        <KpiCard label="Reste à recouvrer" value={num(k.outstanding, false)} unit="MAD" hint={`${k.lateCount} en retard`} />
        <KpiCard label="Solde de caisse" value={num(k.balance, false)} unit="MAD" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recouvrement */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ink">Recouvrement — {currentPeriod()}</h2>
            <Link href="/syndic/recouvrement" className="text-[13px] font-medium text-palier-600 hover:underline">Voir le détail</Link>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-sand/50">
            {seg.map((s) => s.n > 0 && (
              <div key={s.key} style={{ width: `${(s.n / d.recouvrement.length) * 100}%`, backgroundColor: s.color }} />
            ))}
          </div>
          <div className="mt-3 flex gap-4">
            {seg.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[12px] text-ink-soft">{s.label}</span>
                <span className="text-[12px] font-medium text-ink">{s.n}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick stats */}
        <Card>
          <h2 className="mb-3 text-[14px] font-semibold text-ink">Résumé</h2>
          <div className="space-y-3">
            {[
              { label: "Lots", v: k.lots, sub: `${k.residents} résidents` },
              { label: "Incidents ouverts", v: k.openIncidents, sub: "à traiter" },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-ink-soft">{m.label}</p>
                  <p className="text-[11px] text-ink-soft">{m.sub}</p>
                </div>
                <span className="text-[18px] font-semibold text-ink">{m.v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Incidents */}
      <Card className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-ink">Incidents récents</h2>
          <Link href="/syndic/incidents" className="text-[13px] font-medium text-palier-600 hover:underline">Tout voir</Link>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {d.incidents.slice(0, 4).map((i: { id: string; title: string; reporter_name: string; created_at: string; status: string; urgency: string }) => (
            <div key={i.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{i.title}</p>
                <p className="text-[12px] text-ink-soft">{i.reporter_name} · {timeAgo(i.created_at)}</p>
              </div>
              {(i.urgency === "urgent" || i.urgency === "high") && <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">Urgent</span>}
              <StatusPill status={i.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
