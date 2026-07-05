import { fetchSyndicData } from "@/lib/syndic";
import { ResidentsView } from "./ResidentsView";

export default async function SyndicResidents() {
  const d = await fetchSyndicData();
  return (
    <ResidentsView
      residents={d.residents}
      kpis={d.kpis}
      buildingId={d.building.id}
    />
  );
}
