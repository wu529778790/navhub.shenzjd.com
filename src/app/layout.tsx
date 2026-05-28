import type { Metadata } from "next";
import "./globals.css";
import { SitesProvider } from "@/contexts/SitesContext";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { UpdateBanner } from "@/components/UpdateBanner";

// Avoid prerendered HTML being cached at the edge; stale HTML + new deployment
// causes _next/static/chunks/*.js 404 and MIME errors.
export const dynamic = "force-dynamic";

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
          <ToastProvider>
            <SitesProvider>
              <ServiceWorkerRegister />
              <UpdateBanner />
              {children}
            </SitesProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
