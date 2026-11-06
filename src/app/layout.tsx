import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio | AI Content Studio",
  description: "Seu espaço para planejar, criar e organizar conteúdo visual.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
