"use client";
import { useEffect, useState, useCallback } from "react";
import { cities, currentUser } from "./data";

const KEY = "palier_city";

/** Ville sélectionnée (géoloc), persistée localement et synchronisée entre écrans. */
export function useCity() {
  const [slug, setSlug] = useState<string>(currentUser.city);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (stored) setSlug(stored);
    const onChange = (e: Event) => {
      const ce = e as CustomEvent<string>;
      if (ce.detail) setSlug(ce.detail);
    };
    window.addEventListener("palier:city", onChange);
    return () => window.removeEventListener("palier:city", onChange);
  }, []);

  const setCity = useCallback((next: string) => {
    setSlug(next);
    localStorage.setItem(KEY, next);
    window.dispatchEvent(new CustomEvent("palier:city", { detail: next }));
  }, []);

  const city = cities.find((c) => c.slug === slug) ?? cities[0];
  return { slug, city, setCity };
}
