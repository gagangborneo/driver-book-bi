import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PWARegister } from "@/components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SI-LAMIN - Sistem Informasi Layanan Manajemen Intern",
  description: "Sistem Informasi Layanan Manajemen Intern untuk memudahkan perjalanan karyawan dan driver dengan manajemen riwayat perjalanan yang baik.",
  keywords: ["SI-LAMIN", "Layanan Manajemen Intern", "Transportation", "Corporate Travel"],
  authors: [{ name: "SI-LAMIN" }],
  icons: {
    icon: "/favicon.png",
    apple: "/logo-si-lamin.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "SI-LAMIN - Sistem Informasi Layanan Manajemen Intern",
    description: "Sistem Informasi Layanan Manajemen Intern",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SI-LAMIN",
  },
  applicationName: "SI-LAMIN",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SI-LAMIN" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <PWARegister />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
// force restart
