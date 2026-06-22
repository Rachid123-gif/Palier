import { fetchSyndicData } from "@/lib/syndic";
import { PageHeader } from "@/components/syndic/ui";
import { RecouvrementTable } from "@/components/syndic/RecouvrementTable";

export default async function RecouvrementPage() {
  const d = await fetchSyndicData();
  return (
    <div className="animate-[fade_0.3s_ease]">
      <PageHeader
        title="Recouvrement"
        subtitle={`Charges de Juin 2026 · taux ${d.kpis.rate}% · ${d.kpis.lateCount} en retard`}
      />
      <RecouvrementTable rows={d.recouvrement} building={d.building.name} />
    </div>
  );
}
