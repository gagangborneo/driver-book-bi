import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
// force restart
