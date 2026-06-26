"use client";
import { useEffect, useState, useCallback } from "react";
import { cities, currentUser } from "./data";

const KEY = "palier_loc";

// Coordonnées approx. des villes (mapping GPS → ville la plus proche).
const cityCoords: Record<string, [number, number]> = {
  casablanca: [33.5731, -7.5898],
  rabat: [34.0209, -6.8416],
  marrakech: [31.6295, -7.9811],
  tanger: [35.7595, -5.834],
};

export function nearestCity(lat: number, lng: number): string {
  let best = "casablanca";
  let bestD = Infinity;
  for (const [slug, [clat, clng]] of Object.entries(cityCoords)) {
    const d = (lat - clat) ** 2 + (lng - clng) ** 2;
    if (d < bestD) { bestD = d; best = slug; }
  }
  return best;
}

interface Loc { city: string; quartier: string | null }

function read(): Loc {
  if (typeof window === "undefined") return { city: currentUser.city, quartier: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { city: currentUser.city, quartier: null };
}

/** Localisation (ville + quartier), persistée et synchronisée entre écrans. */
export function useCity() {
  const [loc, setLoc] = useState<Loc>({ city: currentUser.city, quartier: null });

  useEffect(() => {
    setLoc(read());
    const onChange = (e: Event) => {
      const ce = e as CustomEvent<Loc>;
      if (ce.detail) setLoc(ce.detail);
    };
    window.addEventListener("palier:loc", onChange);
    return () => window.removeEventListener("palier:loc", onChange);
  }, []);

  const persist = useCallback((next: Loc) => {
    setLoc(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("palier:loc", { detail: next }));
  }, []);

  const setCity = useCallback((city: string, quartier: string | null = null) => persist({ city, quartier }), [persist]);
  const setQuartier = useCallback((quartier: string | null) => persist({ ...read(), quartier }), [persist]);

  const city = cities.find((c) => c.slug === loc.city) ?? cities[0];
  return { slug: loc.city, city, quartier: loc.quartier, setCity, setQuartier };
}

export const LOC_DETECTED_KEY = "palier_loc_detected";
