import Link from "next/link";
import { fetchSyndicData } from "@/lib/syndic";
import { PageHeader, KpiCard, Card, StatusPill } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { mad, num, timeAgo } from "@/lib/format";

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
    { key: "paid", label: "Payé", n: counts.paid, color: "#2e9e6b" },
    { key: "partial", label: "Partiel", n: counts.partial, color: "#2f74c0" },
    { key: "due", label: "À payer", n: counts.due, color: "#d9961f" },
    { key: "late", label: "En retard", n: counts.late, color: "#d6453f" },
  ];

  return (
    <div className="animate-[fade_0.3s_ease]">
      <PageHeader
        title="Tableau de bord"
        subtitle={`${d.building.name} · ${d.building.city} · Juin 2026`}
        action={
          <Link href="/syndic/recouvrement" className="tap inline-flex items-center gap-2 rounded-full bg-palier-600 px-4 py-2.5 text-sm font-semibold text-white">
            <Icon name="HandCoins" className="h-4 w-4" /> Lancer le recouvrement
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard icon="TrendingUp" label="Taux de recouvrement" value={`${k.rate}%`} tint="bg-success-soft" color="text-success" hint={`${counts.paid}/${k.lots} lots à jour`} />
        <KpiCard icon="Banknote" label="Encaissé ce mois" value={num(k.collected, false)} unit="MAD" tint="bg-palier-100" color="text-palier-600" hint={`sur ${num(k.expected, false)} MAD appelés`} />
        <KpiCard icon="AlertCircle" label="Reste à recouvrer" value={num(k.outstanding, false)} unit="MAD" tint="bg-warning-soft" color="text-warning" hint={`${k.lateCount} en retard · ${k.partialCount} partiels`} />
        <KpiCard icon="Wallet" label="Solde de la caisse" value={num(k.balance, false)} unit="MAD" tint="bg-coral-400/20" color="text-coral-600" />
        <KpiCard icon="Building2" label="Lots / résidents" value={`${k.lots}`} unit={`lots · ${k.residents} rés.`} tint="bg-info-soft" color="text-info" />
        <KpiCard icon="TriangleAlert" label="Incidents ouverts" value={`${k.openIncidents}`} tint="bg-danger-soft" color="text-danger" hint="à traiter" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recouvrement breakdown */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-ink">Santé du recouvrement — Juin 2026</h2>
            <Link href="/syndic/recouvrement" className="text-[13px] font-semibold text-palier-600">Détail →</Link>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-sand">
            {seg.map((s) => s.n > 0 && (
              <div key={s.key} style={{ width: `${(s.n / d.recouvrement.length) * 100}%`, backgroundColor: s.color }} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {seg.map((s) => (
              <div key={s.key} className="rounded-xl bg-[#faf8f3] p-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[12px] text-ink-soft">{s.label}</span>
                </div>
                <p className="mt-1 text-[20px] font-bold text-ink">{s.n}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Marketplace */}
        <Card>
          <h2 className="mb-3 text-[16px] font-bold text-ink">Marketplace</h2>
          <div className="space-y-3">
            {[
              { icon: "Store", label: "Prestataires actifs", v: d.marketplace.providers, color: "text-palier-600", tint: "bg-palier-100" },
              { icon: "CalendarCheck", label: "Réservations", v: d.marketplace.bookings, color: "text-info", tint: "bg-info-soft" },
              { icon: "FileQuestion", label: "Demandes de devis", v: d.marketplace.requests, color: "text-warning", tint: "bg-warning-soft" },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${m.tint}`}><Icon name={m.icon} className={`h-4 w-4 ${m.color}`} /></span>
                <span className="flex-1 text-[13px] text-ink-soft">{m.label}</span>
                <span className="text-[16px] font-bold text-ink">{m.v}</span>
              </div>
            ))}
          </div>
          <Link href="/syndic/marketplace" className="mt-4 block rounded-xl bg-palier-50 py-2 text-center text-[13px] font-semibold text-palier-700">Gérer la marketplace</Link>
        </Card>
      </div>

      {/* Incidents récents */}
      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-ink">Incidents récents</h2>
          <Link href="/syndic/incidents" className="text-[13px] font-semibold text-palier-600">Tout voir →</Link>
        </div>
        <div className="divide-y divide-black/5">
          {d.incidents.slice(0, 4).map((i: { id: string; title: string; reporter_name: string; created_at: string; status: string; urgency: string }) => (
            <div key={i.id} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-danger-soft"><Icon name="Wrench" className="h-4 w-4 text-danger" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink">{i.title}</p>
                <p className="text-[12px] text-ink-faint">Signalé par {i.reporter_name} · {timeAgo(i.created_at)}</p>
              </div>
              {i.urgency === "urgent" && <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">Urgent</span>}
              <StatusPill status={i.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
