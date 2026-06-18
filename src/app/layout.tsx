import type { Metadata } from "next";
import { Barlow, Nunito } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-barlow",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-nunito",
});

const gin = localFont({
  src: "../../public/fonts/Gin.otf",
  variable: "--font-gin",
});

const goodOT = localFont({
  src: "../../public/fonts/GoodOT.otf",
  variable: "--font-good-ot",
});

const goodOTCondBold = localFont({
  src: "../../public/fonts/GoodOT-CondBold.otf",
  variable: "--font-good-ot-cond-bold",
});

const taroca = localFont({
  src: "../../public/fonts/Taroca.ttf",
  variable: "--font-taroca",
});

export const metadata: Metadata = {
  title: "ChronicleOS - Vampiro: A Máscara 5E",
  description: "Gerenciador de fichas interativo e reativo para campanhas de Vampiro: A Máscara 5ª Edição.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${barlow.variable} ${nunito.variable} ${gin.variable} ${goodOT.variable} ${goodOTCondBold.variable} ${taroca.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col bg-bg-main text-text-primary"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
