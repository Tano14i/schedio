import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair"
});

export const metadata: Metadata = {
  title: "Sampietrino — Roma in un Box",
  description:
    "A piece of Rome in the Netherlands. Premium pasta boxes with authentic Italian DOP ingredients and a step-by-step video cooking guide."
};

export default function SampietrinoLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className={playfair.variable}>{children}</div>;
}
