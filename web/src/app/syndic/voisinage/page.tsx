import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { VoisinageView } from "./VoisinageView";

export const dynamic = "force-dynamic";

export default async function VoisinageSyndicPage() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  const voisinageCats = d.settings?.voisinage_categories ?? null;
  return <VoisinageView posts={d.posts} buildingName={d.building.name} buildingId={session.buildingId} voisinageCategories={voisinageCats} />;
}
