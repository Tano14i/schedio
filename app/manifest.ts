import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Schedio",
    short_name: "Schedio",
    description: "Richieste, appuntamenti e preventivi in ordine.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F9FB",
    theme_color: "#1F4D6B",
    lang: "it-IT",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
