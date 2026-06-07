import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Analytics from "@/components/Analytics";
import "./globals.css";
import "material-symbols/outlined.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DBDB — The Dive Bar Database",
  description: "Plot, search, and rate cozy local taprooms. Compare draft sizes, ml prices, and vibes in real-time.",
  metadataBase: new URL("https://divebardb.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍺</text></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#131313] text-[#e5e2e1] overflow-hidden selection:bg-[#f59e0b]/30 selection:text-[#ffc174]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
