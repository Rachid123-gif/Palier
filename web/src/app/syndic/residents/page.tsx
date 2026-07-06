import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { ResidentsView } from "./ResidentsView";

export default async function SyndicResidents() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  return (
    <ResidentsView
      residents={d.residents}
      kpis={d.kpis}
      buildingId={d.building.id}
    />
  );
}
