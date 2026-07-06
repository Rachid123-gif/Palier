import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { loadBuildingSettings } from "@/lib/actions";
import { SettingsView } from "./SettingsView";

export default async function SyndicParametres() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  const settings = await loadBuildingSettings(d.building.id);
  return (
    <SettingsView
      building={d.building}
      settings={settings}
    />
  );
}
