import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // 现代化遮罩 - 玻璃拟态增强
      "fixed inset-0 z-[100]",
      "bg-[var(--neutral-900)]/60 backdrop-blur-md",
      "backdrop-saturate-150 backdrop-hue-rotate-15",

      // 高性能动画
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",

      // 深色模式优化
      "dark:bg-[var(--neutral-900)]/70",

      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // ===== 基础布局系统 =====
        "fixed left-[50%] top-[50%] z-[100]",
        "w-full max-w-lg",
        "translate-x-[-50%] translate-y-[-50%]",

        // ===== 玻璃拟态容器 =====
        "bg-[var(--background)]/90 backdrop-blur-xl",
        "border border-[var(--border)]",
        "rounded-[var(--radius-2xl)]",

        // ===== 增强阴影系统 =====
        "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15),0_8px_16px_-8px_rgba(0,0,0,0.1)]",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset]",

        // ===== 移动端优化 =====
        "sm:max-w-lg",
        "max-h-[90vh] overflow-y-auto",

        // ===== 现代化动画 =====
        "duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]",

        // ===== 深色模式适配 =====
        "dark:bg-[var(--background)]/95",
        "dark:border-[var(--border-strong)]",
        "dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_8px_16px_-8px_rgba(0,0,0,0.3)]",

        // ===== 内容填充 =====
        "p-6",

        className
      )}
      {...props}
    >
      {children}

      {/* 现代化关闭按钮 - 带悬停反馈 */}
      <DialogPrimitive.Close className={cn(
        // 基础样式
        "absolute right-4 top-4",
        "rounded-[var(--radius-md)]",
        "p-1.5",

        // 颜色和交互
        "text-[var(--muted-foreground)]",
        "hover:text-[var(--foreground)]",
        "hover:bg-[var(--muted)]",

        // 动画和过渡
        "transition-all duration-200 ease-out",
        "active:scale-90 active:rotate-3",

        // 焦点状态
        "focus:outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--primary-500)]",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",

        // 触摸优化
        "w-9 h-9 flex items-center justify-center",
        "touch-manipulation",

        // 深色模式
        "dark:hover:bg-[var(--neutral-800)]"
      )}>
        <X className="h-5 w-5 transition-transform duration-200 hover:rotate-90" />
        <span className="sr-only">关闭弹窗</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      // Skills 规范: 清晰的视觉层次
      "flex flex-col space-y-2 text-left",
      "pb-3 border-b border-[var(--border)]",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
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
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      // Skills 规范: 渐变标题，现代感
      "text-xl font-bold leading-tight tracking-tight",
      "bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-500)]",
      "bg-clip-text text-transparent",
      "dark:from-[var(--primary-400)] dark:to-[var(--primary-300)]",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
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
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
}
