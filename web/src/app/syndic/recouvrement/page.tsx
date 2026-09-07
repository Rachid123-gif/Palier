import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { RecouvrementTable } from "@/components/syndic/RecouvrementTable";
import { RelanceBannerPreview } from "@/components/syndic/RelanceBannerPreview";

export default async function RecouvrementPage() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  const hasCustomMessage = !!d.settings?.relance_message;
  const autoRelanceEnabled = !!d.settings?.auto_relance_enabled;
  const autoReceiptEnabled = !!d.settings?.auto_receipt_enabled;
  return (
    <div>
      <RelanceBannerPreview hasCustomMessage={hasCustomMessage} customMessage={d.settings?.relance_message ?? null} autoRelanceEnabled={autoRelanceEnabled} autoReceiptEnabled={autoReceiptEnabled} />
      <RecouvrementTable rows={d.recouvrement} building={d.building.name} buildingId={d.building.id} chargeCalls={d.chargeCalls} chargeCategories={d.settings?.charge_categories ?? null} relanceMessage={d.settings?.relance_message ?? null} />
    </div>
  );
}
