import { fetchSyndicData } from "@/lib/syndic";
import { AgView } from "./AgView";

export default async function SyndicAg() {
  const d = await fetchSyndicData();
  const residentProfileIds = d.residents
    .filter((r) => r.status === "active")
    .map((r) => r.id);
  return <AgView assemblies={d.assemblies} buildingId={d.building.id} residentProfileIds={residentProfileIds} />;
}
