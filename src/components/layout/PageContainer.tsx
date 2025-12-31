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
    <Container size="lg" className={`py-6 ${className}`}>
      {/* 页面头部 */}
      {(title || description || action) && (
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            {title && (
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {description}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      {/* 页面内容 */}
      <div className="space-y-4">
        {children}
      </div>
    </Container>
  );
}
