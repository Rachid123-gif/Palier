import { fetchSyndicData } from "@/lib/syndic";
import { ChargesView } from "./ChargesView";

export default async function SyndicCharges() {
  const d = await fetchSyndicData();
  return <ChargesView kpis={d.kpis} recouvrement={d.recouvrement} buildingId={d.building.id} />;
}
