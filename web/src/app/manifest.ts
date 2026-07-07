import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Palier — Le voisinage en confiance",
    short_name: "Palier",
    description:
      "La super-app des copropriétés marocaines : charges, immeuble, voisinage et services à domicile.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f1ea",
    theme_color: "#1e5b50",
    orientation: "portrait",
    categories: ["finance", "lifestyle", "utilities"],
    lang: "fr",
    dir: "ltr",
    scope: "/",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/screenshots/dashboard.png", sizes: "1080x1920", type: "image/png", form_factor: "narrow", label: "Tableau de bord" },
      { src: "/screenshots/charges.png", sizes: "1080x1920", type: "image/png", form_factor: "narrow", label: "Mes charges" },
    ],
  };
}
