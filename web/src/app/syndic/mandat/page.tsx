import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { MandatView } from "./MandatView";

export default async function SyndicMandat() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  return <MandatView mandate={d.mandate} buildingId={d.building.id} />;
}
