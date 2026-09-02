import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border-2 border-black bg-clip-padding text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-x-[1px] active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand-orange)] text-white border-black shadow-[3px_3px_0_0_#111111] hover:bg-[var(--brand-orange-hover)] hover:shadow-[4px_4px_0_0_#111111] active:shadow-[1px_1px_0_0_#111111]",
        outline:
          "bg-white text-black border-black shadow-[3px_3px_0_0_#111111] hover:bg-[var(--brand-orange)] hover:text-white active:shadow-[1px_1px_0_0_#111111]",
        secondary:
          "bg-[var(--surface-2)] text-black border-black shadow-[3px_3px_0_0_#111111] hover:bg-[var(--surface-3)] active:shadow-[1px_1px_0_0_#111111]",
        ghost:
          "border-transparent bg-transparent text-black shadow-none hover:bg-[var(--brand-orange)]/10 active:shadow-none",
        destructive:
          "bg-white text-[var(--destructive)] border-[var(--destructive)] shadow-[3px_3px_0_0_var(--destructive)] hover:bg-[var(--destructive)] hover:text-white active:shadow-[1px_1px_0_0_var(--destructive)]",
        link: "border-transparent bg-transparent shadow-none text-[var(--brand-orange)] underline-offset-4 hover:underline active:shadow-none",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-7 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-4 text-base has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-9",
        "icon-xs":
          "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8",
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