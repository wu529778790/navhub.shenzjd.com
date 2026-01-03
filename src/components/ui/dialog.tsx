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
      // 玻璃拟态遮罩 - 更柔和的渐变
      "fixed inset-0 z-50 bg-gradient-to-br from-black/60 via-black/70 to-black/80 backdrop-blur-sm",
      // 流入动画
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
        // 玻璃拟态容器 - 使用项目设计系统
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4",
        "bg-[var(--background)]/95 backdrop-blur-xl border border-[var(--border)]",
        "rounded-[var(--radius-xl)] p-6 shadow-2xl",

        // 增强的阴影系统 - 更立体
        "shadow-[0_20px_50px_-12px_rgba(124,58,237,0.15),0_8px_16px_-8px_rgba(0,0,0,0.2)]",

        // 流畅的动画 - 从上方滑入 + 缩放
        "duration-300 ease-out",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",

        // 深色模式适配
        "dark:bg-[var(--background)]/90 dark:border-[var(--border-strong)]",

        className
      )}
      {...props}
    >
      {children}

      {/* 优化的关闭按钮 - 更现代的交互 */}
      <DialogPrimitive.Close className={cn(
        "absolute right-4 top-4 rounded-md p-1.5",
        "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        "hover:bg-[var(--muted)] transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-2",
        "data-[state=open]:bg-[var(--muted)] data-[state=open]:text-[var(--foreground)]",
        "active:scale-95"
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
      // 现代化头部布局 - 增加视觉层次
      "flex flex-col space-y-3 text-center sm:text-left",
      "border-b border-[var(--border)] pb-4",
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
      // 优化的底部操作区 - 更好的移动端适配
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      "border-t border-[var(--border)] pt-4 mt-2",
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
      // 现代化标题 - 渐变文字效果
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
      // 增强的描述文本 - 更好的可读性
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
