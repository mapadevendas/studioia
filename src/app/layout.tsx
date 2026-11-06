import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cardume · Estúdio de conteúdo",
  description: "Organizado por natureza, feito para multiplicar. Crie carrosséis, posts, stories e capas com a identidade da sua marca.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
