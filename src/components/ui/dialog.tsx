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
        // Skills 规范: 移动端优化 - 全宽，底部圆角
        "fixed left-0 bottom-0 w-full z-[100]",
        "bg-[var(--background)] border-t border-[var(--border)]",
        "rounded-t-[var(--radius-2xl)] p-4",

        // 桌面端: 居中，限制宽度
        "sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:w-full sm:max-w-lg",
        "sm:translate-x-[-50%] sm:translate-y-[-50%]",
        "sm:rounded-[var(--radius-xl)] sm:border sm:border-[var(--border)]",
        "sm:shadow-2xl",

        // 增强的阴影系统 (Skills 风格)
        "sm:shadow-[0_20px_50px_-12px_rgba(124,58,237,0.15),0_8px_16px_-8px_rgba(0,0,0,0.2)]",

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
    >
      {children}

      {/* 优化的关闭按钮 - 右上角，易触达 */}
      <DialogPrimitive.Close className={cn(
        "absolute right-3 top-3 rounded-md p-1.5",
        "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        "hover:bg-[var(--muted)] transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-2",
        "active:scale-95",
        // 移动端增大触摸区域
        "w-8 h-8 flex items-center justify-center"
      )}>
        <X className="h-5 w-5" />
        <span className="sr-only">关闭</span>
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
