import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { AgView } from "./AgView";

export default async function SyndicAg() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  const residentProfileIds = d.residents
    .filter((r) => r.status === "active")
    .map((r) => r.id);
  return <AgView assemblies={d.assemblies} buildingId={d.building.id} residentProfileIds={residentProfileIds} />;
}
