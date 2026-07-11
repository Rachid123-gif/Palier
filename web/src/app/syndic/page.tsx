import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { DashboardView } from "./DashboardView";

export default async function SyndicDashboard() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  return <DashboardView data={d} />;
}
