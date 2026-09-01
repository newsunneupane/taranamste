import type { Metadata } from "next";
// Import Inter (for clean body text) and Ubuntu (for technical headers/accents)
import { Inter, Ubuntu } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/providers/AppProvider";
import { AppShell } from "@/components/organisms/AppShell";

// Standard Sans-Serif for highly readable data tables and body text
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

// Ubuntu for your "System Directive" headers, branding, and emphasis
const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  weight: ["300", "400", "500", "700"], // Ubuntu requires weights to be specified
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "OrphanAdmin | Tara Nameste Baal Gram",
  description: "Internal management and financial audit system for Tara Namaste Orphanage.",
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${ubuntu.variable}`}>
      <body className="
        min-h-full flex flex-col 
        /* Set Inter as the default base font */
        font-sans text-[13px]
        /* Theme Foundation */
        bg-bg text-text 
        /* Smooth cross-fade */
        transition-colors duration-500 
        selection:bg-primary/30 selection:text-primary
      ">
        <AppProvider>
          <AppShell>
            {children}
          </AppShell>
        </AppProvider>
      </body>
    </html>
  );
}