import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal
const AlertDialogCancel = AlertDialogPrimitive.Cancel
const AlertDialogAction = AlertDialogPrimitive.Action

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // Skills 规范: 高对比度遮罩，确保弹窗清晰可见
      "fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm",
      // 流畅的淡入动画
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        // Skills 规范: 移动端优化 - 全宽，底部圆角
        "fixed left-0 bottom-0 w-full z-[100]",
        "bg-[var(--background)] border-t border-[var(--border)]",
        "rounded-t-[var(--radius-2xl)] p-4",

        // 桌面端: 居中，限制宽度
        "sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:w-full sm:max-w-lg",
        "sm:translate-x-[-50%] sm:translate-y-[-50%]",
        "sm:rounded-[var(--radius-xl)] sm:border sm:border-[var(--border)]",
        "sm:shadow-2xl",

        // 增强的阴影系统 - 红色警示风格 (Skills 风格)
        "sm:shadow-[0_20px_50px_-12px_rgba(239,68,68,0.25),0_8px_16px_-8px_rgba(0,0,0,0.2)]",

        // 流畅动画 - 从下方滑入 (移动端) / 从上方滑入 (桌面端)
        "duration-300 ease-out",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-top-[48%]",
        "data-[state=closed]:slide-out-to-bottom-100 data-[state=open]:slide-in-from-bottom-100",
        "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",

        // 深色模式适配
        "dark:bg-[var(--background)]/95 dark:border-[var(--border-strong)]",

        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      // Skills 规范: 清晰的视觉层次 + 警示图标布局
      "flex flex-col space-y-3 text-left",
      "pb-3 border-b border-[var(--border)]",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      // Skills 规范: 移动端垂直排列，桌面端水平排列
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      // 移动端顶部边框分隔
      "pt-4 mt-4 border-t border-[var(--border)]",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn(
      // Skills 规范: 警告标题 - 强烈的红色渐变
      "text-xl font-bold leading-tight tracking-tight",
      "bg-gradient-to-r from-[var(--error)] to-red-600",
      "bg-clip-text text-transparent",
      className
    )}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn(
      // Skills 规范: 清晰的描述文本
      "text-[var(--foreground-secondary)] text-sm leading-relaxed",
      "dark:text-[var(--muted-foreground)]",
      className
    )}
    {...props}
  />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
}
