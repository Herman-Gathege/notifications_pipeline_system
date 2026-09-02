import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-none border-2 border-black px-2 py-0 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand-orange)] text-white border-black shadow-[2px_2px_0_0_#111111]",
        secondary:
          "bg-white text-black border-black shadow-[2px_2px_0_0_#111111]",
        destructive:
          "bg-white text-[var(--destructive)] border-[var(--destructive)] shadow-[2px_2px_0_0_var(--destructive)]",
        outline:
          "bg-white text-black border-black",
        ghost:
          "bg-transparent border-transparent text-black shadow-none",
        link: "bg-transparent border-transparent text-[var(--brand-orange)] underline-offset-4 hover:underline shadow-none",
        success:
          "bg-white text-green-700 border-green-700 shadow-[2px_2px_0_0_#15803d]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }