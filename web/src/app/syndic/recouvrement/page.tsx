import { fetchSyndicData } from "@/lib/syndic";
import { currentPeriod } from "@/lib/format";
import { PageHeader } from "@/components/syndic/ui";
import { RecouvrementTable } from "@/components/syndic/RecouvrementTable";

export default async function RecouvrementPage() {
  const d = await fetchSyndicData();
  return (
    <div>
      <PageHeader
        title="Recouvrement"
        subtitle={`${d.recouvrement.length} lots · ${currentPeriod()}`}
      />
      <RecouvrementTable rows={d.recouvrement} building={d.building.name} buildingId={d.building.id} chargeCalls={d.chargeCalls} />
    </div>
  );
}
