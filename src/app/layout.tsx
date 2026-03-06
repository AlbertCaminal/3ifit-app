import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EnvGuard } from "@/components/EnvGuard";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeUnlockSync } from "@/components/ThemeUnlockSync";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  preload: false,
});

/** Script para evitar flash de tema incorrecto al cargar */
function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var e=localStorage.getItem("3ifit-theme");var t=window.matchMedia("(prefers-color-scheme: dark)").matches;if(e==="dark"||(!e&&t))document.documentElement.classList.add("dark");})();`,
      }}
    />
  );
}

export const metadata: Metadata = {
  title: "3iFit — PWA Wellness",
  description:
    "App de bienestar corporativo - Plan semanal, misiones, ranking y comunidad",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "3iFit",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f84015",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="absolute -top-12 left-4 z-[9999] rounded-lg bg-[var(--color-primary)] px-4 py-2 text-white opacity-0 transition-all focus:top-4 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
        >
          Saltar al contenido principal
        </a>
        <EnvGuard>
          <ThemeProvider>
            <ThemeUnlockSync />
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </EnvGuard>
      </body>
    </html>
  );
}
