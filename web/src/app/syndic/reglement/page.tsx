import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { ReglementView } from "./ReglementView";

export default async function SyndicReglement() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  return <ReglementView rule={d.coproprieteRule} buildingId={d.building.id} />;
}
