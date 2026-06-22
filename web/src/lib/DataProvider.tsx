"use client";
import { createContext, useContext } from "react";
import type { AppData } from "./queries";
import type { Provider } from "./types";

interface DataCtx extends AppData {
  providersFor: (city: string, category?: string) => Provider[];
  providerById: (id: string) => Provider | undefined;
}

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ value, children }: { value: AppData; children: React.ReactNode }) {
  const ctx: DataCtx = {
    ...value,
    providersFor: (city, category) =>
      value.providers
        .filter((p) => p.city === city && (!category || p.categorySlug === category))
        .sort(
          (a, b) =>
            Number(b.topNeighbor ?? false) - Number(a.topNeighbor ?? false) || b.rating - a.rating,
        ),
    providerById: (id) => value.providers.find((p) => p.id === id),
  };
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useData(): DataCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
