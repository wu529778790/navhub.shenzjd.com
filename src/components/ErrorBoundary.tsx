/**
 * 错误边界组件
 * 捕获 React 组件树中的错误并显示友好的错误信息
 */

"use client";

import React, { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误到控制台
    console.error("ErrorBoundary 捕获到错误:", error, errorInfo);

    // 这里可以发送错误到错误监控服务（如 Sentry）
    // reportErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
          <div className="max-w-md w-full card p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--error)]/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[var(--error)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">出错了</h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  应用遇到了一个错误
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="p-4 rounded-lg bg-[var(--error)]/5 border border-[var(--error)]/20">
                <p className="text-sm font-mono text-[var(--error)] break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-[var(--muted-foreground)] cursor-pointer">
                      查看堆栈跟踪
                    </summary>
                    <pre className="mt-2 text-xs text-[var(--muted-foreground)] overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1 gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex-1 gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                刷新页面
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="flex-1 gap-2"
              >
                <Home className="w-4 h-4" />
                返回首页
              </Button>
            </div>

            <div className="text-xs text-[var(--muted-foreground)] text-center">
              如果问题持续存在，请尝试清除浏览器缓存或联系支持
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 错误边界 Hook（用于函数组件）
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error("错误处理:", error, errorInfo);
    // 这里可以发送错误到错误监控服务
    // reportErrorToService(error, errorInfo);
  };
}
