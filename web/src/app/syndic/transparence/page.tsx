import { fetchSyndicData } from "@/lib/syndic";
import { requireSyndicSession } from "@/lib/auth";
import { TransparenceView } from "./TransparenceView";

export default async function SyndicTransparence() {
  const session = await requireSyndicSession();
  const d = await fetchSyndicData(session.buildingId);
  return <TransparenceView ledger={d.ledger} balance={d.kpis.balance} buildingId={session.buildingId} expenseCategories={d.settings?.expense_categories ?? null} />;
}
