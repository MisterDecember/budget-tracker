import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-earth-cyan/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-earth-cyan text-horizon-void hover:bg-earth-cyan/90 hover:shadow-glow-cyan hover:scale-[1.02]",
        destructive: "bg-negative text-white hover:bg-negative/90 hover:shadow-glow-pink",
        outline: "border border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15]",
        secondary: "bg-white/[0.05] text-foreground hover:bg-white/[0.08]",
        ghost: "hover:bg-white/[0.05] hover:text-foreground",
        link: "text-earth-cyan underline-offset-4 hover:underline",
        success: "bg-positive text-horizon-void hover:bg-positive/90",
        dawn: "bg-gradient-to-r from-dawn-amber to-dawn-pink text-horizon-void hover:shadow-glow-amber hover:scale-[1.02]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
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
