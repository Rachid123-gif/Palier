import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { ServicesView } from "./ServicesView";

export const dynamic = "force-dynamic";

export default async function ServicesSyndicPage() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  const servicePosts = d.posts.filter(
    (p: any) => p.type === "service" || p.type === "recommendation"
  );
  return <ServicesView posts={servicePosts} />;
}
