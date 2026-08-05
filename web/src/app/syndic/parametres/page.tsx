import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { loadBuildingSettings } from "@/lib/actions";
import { supabaseAdmin } from "@/lib/supabase-server";
import { SettingsView } from "./SettingsView";

export default async function SyndicParametres() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  const settings = await loadBuildingSettings(d.building.id);

  // Fetch verified phone from profile
  let verifiedPhone = "";
  if (session.profileId) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("phone")
      .eq("id", session.profileId)
      .single();
    verifiedPhone = profile?.phone ?? "";
  }

  return (
    <SettingsView
      building={d.building}
      settings={settings}
      units={d.units}
      verifiedPhone={verifiedPhone}
    />
  );
}
