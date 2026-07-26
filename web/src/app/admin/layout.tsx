import { requireAdminSession } from "@/lib/admin-auth";
import { fetchAdminData } from "@/lib/admin-queries";
import { AdminShell } from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();
  const data = await fetchAdminData();
  return <AdminShell data={data}>{children}</AdminShell>;
}
