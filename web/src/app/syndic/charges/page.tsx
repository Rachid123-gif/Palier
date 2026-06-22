import { fetchSyndicData } from "@/lib/syndic";
import { PageHeader, KpiCard, Card, StatusPill } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { mad, num } from "@/lib/format";

export default async function SyndicCharges() {
  const d = await fetchSyndicData();
  const k = d.kpis;
  // Vue "appel de fonds" agrégée (la période courante).
  const byStatus = {
    paid: d.recouvrement.filter((r) => r.status === "paid").length,
    partial: d.recouvrement.filter((r) => r.status === "partial").length,
    due: d.recouvrement.filter((r) => r.status === "due").length,
    late: d.recouvrement.filter((r) => r.status === "late").length,
  };

  return (
    <div className="animate-[fade_0.3s_ease]">
      <PageHeader
        title="Charges & appels de fonds"
        subtitle="Émettez et suivez les appels de charges de la copropriété"
        action={
          <button className="tap inline-flex items-center gap-2 rounded-full bg-palier-600 px-4 py-2.5 text-sm font-semibold text-white">
            <Icon name="FilePlus2" className="h-4 w-4" /> Émettre un appel de fonds
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon="ReceiptText" label="Appelé (mois)" value={num(k.expected, false)} unit="MAD" tint="bg-info-soft" color="text-info" />
        <KpiCard icon="Banknote" label="Encaissé" value={num(k.collected, false)} unit="MAD" tint="bg-success-soft" color="text-success" />
        <KpiCard icon="Hourglass" label="En attente" value={num(k.outstanding, false)} unit="MAD" tint="bg-warning-soft" color="text-warning" />
        <KpiCard icon="Percent" label="Taux" value={`${k.rate}%`} tint="bg-palier-100" color="text-palier-600" />
      </div>

      <Card className="mt-6">
        <h2 className="mb-1 text-[16px] font-bold text-ink">Appels de fonds en cours</h2>
        <div className="mt-3 space-y-3">
          <div className="rounded-2xl border border-black/5 bg-[#faf8f3] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[15px] font-bold text-ink">Charges courantes — Juin 2026</p>
                <p className="text-[12px] text-ink-soft">Gardiennage · nettoyage · ascenseur · {mad(650, { decimals: false })} / lot</p>
              </div>
              <StatusPill status="due" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
              <span className="rounded-full bg-success-soft px-3 py-1 font-semibold text-success">{byStatus.paid} payés</span>
              <span className="rounded-full bg-info-soft px-3 py-1 font-semibold text-info">{byStatus.partial} partiels</span>
              <span className="rounded-full bg-warning-soft px-3 py-1 font-semibold text-warning">{byStatus.due} à payer</span>
              <span className="rounded-full bg-danger-soft px-3 py-1 font-semibold text-danger">{byStatus.late} en retard</span>
            </div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-[#faf8f3] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[15px] font-bold text-ink">Provision travaux — Ravalement façade</p>
                <p className="text-[12px] text-ink-soft">Appel en 3 tranches · T2 2026</p>
              </div>
              <StatusPill status="partial" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
