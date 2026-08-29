import { redirect } from "next/navigation";
import { SyndicShell } from "@/components/syndic/SyndicShell";
import { fetchSyndicData } from "@/lib/syndic";
import { getUserBuildings } from "@/lib/queries";
import { requireSyndicSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { RefreshOnFocus } from "@/components/RefreshOnFocus";
import { LangProvider } from "@/lib/LangProvider";

export const dynamic = "force-dynamic";

export default async function SyndicLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSyndicSession();

  // Check membership is still active
  if (session.profileId) {
    const { data: membership } = await supabaseAdmin
      .from("memberships")
      .select("status")
      .eq("profile_id", session.profileId)
      .eq("building_id", session.buildingId)
      .single();

    if (!membership || membership.status === "inactive") {
      redirect("/bienvenue");
    }
  }

  const [data, buildings] = await Promise.all([
    fetchSyndicData(session.buildingId),
    session.profileId ? getUserBuildings(session.profileId) : Promise.resolve([]),
  ]);
  return (
    <LangProvider>
      <SyndicShell
        building={{ name: data.building.name, city: data.building.city }}
        badges={{ dunning: data.kpis.unpaidCount, incidents: data.kpis.openIncidents }}
        syndicName={data.building.syndic || "Syndic"}
        buildings={buildings}
        currentBuildingId={session.buildingId}
        profileId={session.profileId ?? ""}
      >
        {children}
        <RefreshOnFocus />
      </SyndicShell>
    </LangProvider>
  );
}
