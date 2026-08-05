"use client";
import { createContext, useContext } from "react";
import type { AppData } from "./queries";

const Ctx = createContext<AppData | null>(null);

export function DataProvider({ value, children }: { value: AppData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): AppData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
