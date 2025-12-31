import type { Metadata } from "next";
import "./globals.css";
import { SitesProvider } from "@/contexts/SitesContext";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "NavHub",
  description: "NavHub - 个人导航网站，支持本地存储和 GitHub 同步",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <SitesProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SitesProvider>
      </body>
    </html>
  );
}
