import { SyndicShell } from "@/components/syndic/SyndicShell";
import { fetchSyndicData } from "@/lib/syndic";

export const dynamic = "force-dynamic";

export default async function SyndicLayout({ children }: { children: React.ReactNode }) {
  const data = await fetchSyndicData();
  return (
    <SyndicShell
      building={{ name: data.building.name, city: data.building.city }}
      badges={{ dunning: data.kpis.lateCount + data.kpis.partialCount, incidents: data.kpis.openIncidents }}
    >
      {children}
    </SyndicShell>
  );
}
