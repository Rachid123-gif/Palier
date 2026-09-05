"use client";

import { createContext, useContext } from "react";
import type { AdminData } from "@/lib/admin-queries";

interface AdminCtx extends AdminData {
  isDark: boolean;
  toggleTheme: () => void;
}

export const AdminContext = createContext<AdminCtx>(null!);
export function useAdmin() { return useContext(AdminContext); }
