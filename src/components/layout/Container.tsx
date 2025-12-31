/**
 * 容器组件 - 统一的内容宽度和间距
 */

import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
}

export function Container({ children, className = "", size = "md" }: ContainerProps) {
  const sizeClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    full: "max-w-full",
  };

  return (
    <div className={`mx-auto px-4 ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
}
