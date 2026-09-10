import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-none border-2 border-[var(--ink)] bg-clip-padding text-sm font-bold whitespace-nowrap transition-[transform,box-shadow,background-color,color,border-color] duration-150 ease-out outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-orange)] disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none aria-invalid:border-[var(--destructive)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-[var(--ink)] bg-[var(--brand-orange)] text-white shadow-[var(--shadow-brutal-sm)] hover:bg-[var(--brand-orange-hover)] hover:shadow-[var(--shadow-brutal)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-brutal-xs)]",
        outline:
          "border-[var(--ink)] bg-surface-1 text-[var(--ink)] shadow-[var(--shadow-brutal-sm)] hover:bg-[var(--ink)] hover:text-white hover:shadow-[var(--shadow-brutal)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-brutal-xs)]",
        secondary:
          "border-[var(--ink)] bg-surface-2 text-[var(--ink)] shadow-[var(--shadow-brutal-sm)] hover:bg-surface-3 hover:shadow-[var(--shadow-brutal)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[var(--shadow-brutal-xs)]",
        ghost:
          "border-transparent bg-transparent text-[var(--ink)] shadow-none hover:bg-surface-2 hover:text-[var(--ink)]",
        destructive:
          "border-[var(--destructive)] bg-surface-1 text-[var(--destructive)] shadow-[1px_1px_0_0_var(--destructive)] hover:bg-[var(--destructive)] hover:text-white hover:shadow-[var(--shadow-brutal-danger)] active:translate-x-[1px] active:translate-y-[1px]",
        link: "border-transparent bg-transparent p-0 font-bold text-[var(--brand-orange)] shadow-none underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 px-5 text-[15px] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-8 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm":
          "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg":
          "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
