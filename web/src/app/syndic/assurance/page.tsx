import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { AssuranceView } from "./AssuranceView";

export default async function SyndicAssurance() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  return <AssuranceView policies={d.insurancePolicies} buildingId={d.building.id} />;
}
