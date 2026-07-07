import { requireSyndicSession } from "@/lib/auth";
import { fetchSyndicData } from "@/lib/syndic";
import ComptabiliteView from "./ComptabiliteView";

export default async function ComptabilitePage() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  return (
    <ComptabiliteView
      building={d.building}
      ledger={d.ledger}
      budgets={d.budgets}
      recouvrement={d.recouvrement}
      kpis={d.kpis}
      urgentWorks={d.urgentWorks}
    />
  );
}
