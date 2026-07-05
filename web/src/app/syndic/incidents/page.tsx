import { fetchSyndicData } from "@/lib/syndic";
import { IncidentsBoard } from "./IncidentsBoard";

export default async function SyndicIncidents() {
  const d = await fetchSyndicData();
  return <IncidentsBoard incidents={d.incidents} openCount={d.kpis.openIncidents} />;
}
