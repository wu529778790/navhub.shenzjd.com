import type { Metadata } from "next";
import "./globals.css";
import { SitesProvider } from "@/contexts/SitesContext";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

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
        <ErrorBoundary>
          <SitesProvider>
            <ToastProvider>
              <ServiceWorkerRegister />
              {children}
            </ToastProvider>
          </SitesProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
