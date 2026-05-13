import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "THVMAX FITNESS — S+ Tier Program",
  description: "Personal workout tracker & progress journal by Thvmax",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050506",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="noise-bg">
        <main className="pb-24 min-h-screen">{children}</main>
        <Navigation />
      </body>
    </html>
  );
}
