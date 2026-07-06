import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { currentPeriod } from "@/lib/format";
import { PageHeader } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { RecouvrementTable } from "@/components/syndic/RecouvrementTable";

export default async function RecouvrementPage() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  return (
    <div>
      <PageHeader
        title="Recouvrement"
        subtitle={`${d.recouvrement.length} lots · ${currentPeriod()}`}
      />
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
        <p className="text-[12px] text-ink-soft">
          Relancer un résident lui enverra un rappel de paiement directement dans son application Palier. Les résidents voient leur solde et historique de paiement depuis leur application.
        </p>
      </div>
      <RecouvrementTable rows={d.recouvrement} building={d.building.name} buildingId={d.building.id} chargeCalls={d.chargeCalls} chargeCategories={d.settings?.charge_categories ?? null} relanceMessage={d.settings?.relance_message ?? null} />
    </div>
  );
}
