import { SyndicShell } from "@/components/syndic/SyndicShell";
import { fetchSyndicData } from "@/lib/syndic";
import { getUserBuildings } from "@/lib/queries";
import { requireSyndicSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SyndicLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSyndicSession();
  const [data, buildings] = await Promise.all([
    fetchSyndicData(session.buildingId),
    session.profileId ? getUserBuildings(session.profileId) : Promise.resolve([]),
  ]);
  return (
    <SyndicShell
      building={{ name: data.building.name, city: data.building.city }}
      badges={{ dunning: data.kpis.lateCount + data.kpis.partialCount, incidents: data.kpis.openIncidents }}
      syndicName={data.building.syndic || "Syndic"}
      buildings={buildings}
      currentBuildingId={session.buildingId}
    >
      {children}
    </SyndicShell>
  );
}
