import { fetchSyndicData } from "@/lib/syndic";
import { VoisinageView } from "./VoisinageView";

export const dynamic = "force-dynamic";

export default async function VoisinageSyndicPage() {
  const d = await fetchSyndicData();
  return <VoisinageView posts={d.posts} buildingName={d.building.name} />;
}
