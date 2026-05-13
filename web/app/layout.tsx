import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { GlobalProvider } from "@/context/GlobalContext";
import ThemeScript from "@/components/ThemeScript";
import LayoutWrapper from "@/components/LayoutWrapper";
import { I18nClientBridge } from "@/i18n/I18nClientBridge";
import TechParticles from "@/components/TechParticles";
import TechOverlay from "@/components/TechOverlay";
import ZhiMaiMark from "@/components/ZhiMaiMark";

// Use Inter font with swap display for better loading
const font = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "智脉",
  description: "Multi-Agent Teaching & Research Copilot",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={font.className}>
        <TechParticles />
        <ZhiMaiMark />
        <TechOverlay />
        <GlobalProvider>
          <I18nClientBridge>
            <LayoutWrapper>
              <div className="flex h-screen bg-transparent overflow-hidden transition-colors duration-200">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-transparent">
                  <div className="min-h-full px-4 py-4 md:px-6 md:py-6">
                    <div className="max-w-6xl mx-auto">{children}</div>
                  </div>
                </main>
              </div>
            </LayoutWrapper>
          </I18nClientBridge>
        </GlobalProvider>
      </body>
    </html>
  );
}
