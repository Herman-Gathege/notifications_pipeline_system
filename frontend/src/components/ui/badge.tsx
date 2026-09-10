import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-none border-2 px-2 py-0 text-[10px] font-black uppercase tracking-[0.08em] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-orange)] aria-invalid:border-[var(--destructive)] [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand-orange)] text-white border-[var(--brand-orange)]",
        secondary:
          "bg-surface-2 text-[var(--ink-soft)] border-[var(--border-mid)]",
        destructive:
          "bg-[var(--destructive-soft)] text-[var(--destructive)] border-[var(--destructive)]",
        outline:
          "bg-surface-1 text-[var(--ink-soft)] border-[var(--ink)]",
        ghost:
          "bg-transparent border-transparent text-[var(--ink-muted)]",
        link: "bg-transparent border-transparent text-[var(--brand-orange)] underline-offset-4 hover:underline shadow-none",
        success:
          "bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]",
        warning:
          "bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]",
        info:
          "bg-[var(--info-soft)] text-[var(--info)] border-[var(--info)]",
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
