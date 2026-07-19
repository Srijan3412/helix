import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "projectAnalyser — Understand Any Codebase in 30 Seconds",
  description: "Upload ZIPs or paste GitHub URLs to automatically discover routing patterns, dependency maps, and configuration settings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full dark ${inter.variable} antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-background font-sans">
        <Providers>
          <div className="flex-1 flex flex-col">
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <footer className="mt-auto border-t border-border/20 bg-zinc-950/40 backdrop-blur-md py-6 px-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              <div className="text-center sm:text-left">
                <p className="text-xs text-zinc-400 font-medium">Built by <span className="text-zinc-200 font-bold">Shriniwas Srijan Bajpai</span></p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  <a href="mailto:srijanbajpai1447@gmail.com" className="hover:text-primary transition">srijanbajpai1447@gmail.com</a>
                </p>
              </div>
              
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
