import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SitesProvider } from "@/contexts/SitesContext";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { UpdateBanner } from "@/components/UpdateBanner";
import { NavLogoutCleanup } from "@/components/NavLogoutCleanup";

export const metadata: Metadata = {
  title: {
    default: "NavHub - 个人导航网站",
    template: "%s | NavHub",
  },
  description:
    "NavHub 是一个现代化的个人导航书签管理工具，支持本地存储和 GitHub 同步，让你随时随地访问常用网站。",
  keywords: ["导航", "书签", "收藏夹", "个人导航", "NavHub", "bookmark", "navigation"],
  authors: [{ name: "NavHub" }],
  creator: "NavHub",
  metadataBase: new URL("https://navhub.shenzjd.com"),
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://navhub.shenzjd.com",
    siteName: "NavHub",
    title: "NavHub - 个人导航网站",
    description:
      "现代化的个人导航书签管理工具，支持本地存储和 GitHub 同步。",
  },
  twitter: {
    card: "summary_large_image",
    title: "NavHub - 个人导航网站",
    description: "现代化的个人导航书签管理工具，支持本地存储和 GitHub 同步。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
            <SitesProvider>
              <NavLogoutCleanup />
              <ServiceWorkerRegister />
              <UpdateBanner />
              {children}
            </SitesProvider>
          </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
