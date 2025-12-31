import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SitesProvider } from "@/contexts/SitesContext";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "个人导航",
  description: "个人导航网站 - 支持本地存储和 GitHub 同步",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SitesProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SitesProvider>
      </body>
    </html>
  );
}
