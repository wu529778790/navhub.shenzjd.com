/**
 * Toast 通知组件
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info", duration?: number) => void;
}

let showToastCallback: ((message: string, type?: "success" | "error" | "info", duration?: number) => void) | null = null;

export function showToast(message: string, type: "success" | "error" | "info" = "info", duration: number = 3000) {
  if (showToastCallback) {
    showToastCallback(message, type, duration);
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info", duration: number = 3000) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    showToastCallback = showToast;
    return () => {
      showToastCallback = null;
    };
  }, [showToast]);

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4" />;
      case "error":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    };
  };

  const getColors = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-600 text-white";
      case "error":
        return "bg-red-600 text-white";
      default:
        return "bg-blue-600 text-white";
    };
  };

  return (
    <>
      {children}
      {/* Toast 容器 */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${getColors(toast.type)} animate-in slide-in-from-right-full`}
            style={{
              animation: "slideInFromRight 0.3s ease-out",
            }}
          >
            {getIcon(toast.type)}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
