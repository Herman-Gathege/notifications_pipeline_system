import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid w-full gap-1 rounded-none border-2 px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-20 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-[var(--ink)] bg-surface-1 text-[var(--ink)] *:data-[slot=alert-description]:text-[var(--ink-muted)]",
        destructive:
          "border-[var(--destructive)] bg-[var(--destructive-soft)] text-[var(--destructive)] *:data-[slot=alert-description]:text-[var(--destructive)]/85",
        success:
          "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)] *:data-[slot=alert-description]:text-[var(--success)]/85",
        warning:
          "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--warning)] *:data-[slot=alert-description]:text-[var(--warning)]/85",
        info: "border-[var(--info)] bg-[var(--info-soft)] text-[var(--info)] *:data-[slot=alert-description]:text-[var(--info)]/85",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "text-sm font-black uppercase tracking-[0.04em] group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm leading-relaxed text-[var(--ink-muted)] md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-3 right-3", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
