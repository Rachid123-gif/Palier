import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { IncidentsBoard } from "./IncidentsBoard";

export default async function SyndicIncidents() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  return <IncidentsBoard incidents={d.incidents} openCount={d.kpis.openIncidents} />;
}
