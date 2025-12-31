/**
 * 页面容器组件 - 提供统一的页面布局
 */

import { ReactNode } from "react";
import { Container } from "./Container";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageContainer({
  children,
  title,
  description,
  action,
  className = "",
}: PageContainerProps) {
  return (
    <Container size="lg" className={`w-full py-6 ${className}`}>
      {/* 页面头部 */}
      {action && (
        <div className="mb-6 flex justify-end w-full">
          {action}
        </div>
      )}

      {/* 页面内容 */}
      <div className="space-y-4 w-full">
        {children}
      </div>
    </Container>
  );
}
