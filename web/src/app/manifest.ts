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
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
