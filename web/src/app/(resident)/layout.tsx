import { redirect } from "next/navigation";
import { BottomNav } from "@/components/resident/BottomNav";
import { BuildingSwitcherResident } from "@/components/resident/BuildingSwitcherResident";
import { DeactivatedBanner } from "@/components/resident/DeactivatedBanner";
import { DataProvider } from "@/lib/DataProvider";
import { LangProvider } from "@/lib/LangProvider";
import { fetchAppData, getUserBuildings } from "@/lib/queries";
import { requireSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { RefreshOnFocus } from "@/components/RefreshOnFocus";

export const dynamic = "force-dynamic";

export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  // Check membership is still active
  if (session.profileId) {
    const { data: membership } = await supabaseAdmin
      .from("memberships")
      .select("status")
      .eq("profile_id", session.profileId)
      .eq("building_id", session.buildingId)
      .single();

    if (!membership || membership.status === "inactive") {
      redirect("/bienvenue?expired=1");
    }
  }

  const buildings = session.profileId ? await getUserBuildings(session.profileId) : [];
  const data = await fetchAppData(session.buildingId, session.profileId, session.unitId, buildings);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#e7e1d6] sm:p-6">
      <div className="relative h-dvh w-full overflow-hidden bg-cream sm:h-[860px] sm:max-w-[420px] sm:rounded-[44px] sm:border-[10px] sm:border-black sm:shadow-2xl">
        <LangProvider>
          <DataProvider value={data}>
            <main id="main-content" className="no-scrollbar h-full overflow-y-auto pb-24">
              <DeactivatedBanner />
              <BuildingSwitcherResident />
              {children}
            </main>
            <BottomNav />
            <RefreshOnFocus />
          </DataProvider>
        </LangProvider>
      </div>
    </div>
  );
}
