import { fetchSyndicData } from "@/lib/syndic";
import { TransparenceView } from "./TransparenceView";

export default async function SyndicTransparence() {
  const d = await fetchSyndicData();
  return <TransparenceView ledger={d.ledger} balance={d.kpis.balance} expenseCategories={d.settings?.expense_categories ?? null} />;
}
