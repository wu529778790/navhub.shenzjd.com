import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // 基础样式 - 现代化按钮
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-500)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // 主按钮 - 渐变阴影效果
        default: "bg-[var(--primary-600)] text-white shadow-lg hover:bg-[var(--primary-700)] hover:shadow-xl",

        // 危险按钮
        destructive: "bg-[var(--error)] text-white shadow-lg hover:bg-red-600 hover:shadow-xl",

        // 轮廓按钮
        outline: "border-2 border-[var(--primary-500)] text-[var(--primary-600)] bg-transparent hover:bg-[var(--primary-50)] hover:border-[var(--primary-600)]",

        // 次要按钮
        secondary: "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--neutral-200)]",

        // 幽灵按钮
        ghost: "text-[var(--foreground-secondary)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",

        // 链接按钮
        link: "text-[var(--primary-600)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[var(--radius-sm)] px-3 text-xs",
        lg: "h-11 rounded-[var(--radius-md)] px-6 text-base",
        icon: "h-10 w-10 p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
