"use client";

import { createContext, useContext } from "react";
import type { AdminData } from "@/lib/admin-queries";

export const AdminContext = createContext<AdminData>(null!);
export function useAdmin() { return useContext(AdminContext); }
