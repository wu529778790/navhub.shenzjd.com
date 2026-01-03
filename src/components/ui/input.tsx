import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // 现代化输入框 - 使用项目设计系统
          "flex w-full rounded-[var(--radius-md)] border border-[var(--input-border)]",
          "bg-[var(--background)] text-[var(--foreground)]",
          "px-3 py-2.5 text-sm shadow-sm",

          // 交互状态
          "transition-all duration-200 ease-out",
          "placeholder:text-[var(--muted-foreground)]",

          // 焦点状态 - 使用主色调
          "focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent",

          // 禁用状态
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--muted)]",

          // 深色模式适配
          "dark:bg-[var(--background)] dark:border-[var(--border-strong)]",

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
