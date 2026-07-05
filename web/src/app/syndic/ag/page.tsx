import { fetchSyndicData } from "@/lib/syndic";
import { AgView } from "./AgView";

export default async function SyndicAg() {
  const d = await fetchSyndicData();
  return <AgView assembly={d.assembly} buildingId={d.building.id} />;
}
