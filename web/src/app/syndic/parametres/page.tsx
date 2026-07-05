import { fetchSyndicData } from "@/lib/syndic";
import { loadBuildingSettings } from "@/lib/actions";
import { SettingsView } from "./SettingsView";

export default async function SyndicParametres() {
  const d = await fetchSyndicData();
  const settings = await loadBuildingSettings(d.building.id);
  return (
    <SettingsView
      building={d.building}
      settings={settings}
    />
  );
}
