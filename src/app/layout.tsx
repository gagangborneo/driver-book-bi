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
  title: "Bank Indonesia - Driver Booking System",
  description: "Sistem Booking Driver Bank Indonesia untuk memudahkan perjalanan karyawan dan driver dengan manajemen riwayat perjalanan yang baik.",
  keywords: ["Bank Indonesia", "Driver Booking", "Transportation", "Corporate Travel"],
  authors: [{ name: "Bank Indonesia" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Bank Indonesia - Driver Booking System",
    description: "Sistem Booking Driver Bank Indonesia",
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
