import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { TravauxUrgentsView } from "./TravauxUrgentsView";

export default async function SyndicTravauxUrgents() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  return (
    <TravauxUrgentsView
      urgentWorks={d.urgentWorks}
      incidents={d.incidents}
      buildingId={session.buildingId}
    />
  );
}
