import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-semibold transition-all duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-500)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-700)] text-white shadow-[0_14px_24px_-14px_rgba(15,108,97,0.9)] hover:brightness-110",
        destructive:
          "bg-[var(--error)] text-white shadow-[0_14px_24px_-14px_rgba(217,74,74,0.9)] hover:brightness-110",
        outline:
          "border border-[var(--primary-300)] bg-[var(--background-secondary)] text-[var(--primary-700)] hover:bg-[var(--primary-50)]",
        secondary:
          "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--neutral-200)]",
        ghost:
          "text-[var(--foreground-secondary)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
        link: "text-[var(--primary-700)] underline-offset-4 hover:underline",
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
