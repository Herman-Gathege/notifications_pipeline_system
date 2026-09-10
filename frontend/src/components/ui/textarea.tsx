import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full resize-y rounded-none border-2 border-[var(--ink)] bg-surface-1 px-3 py-2.5 text-base leading-relaxed shadow-none transition-[border-color,box-shadow,background-color] duration-150 outline-none",
        "placeholder:text-[var(--ink-faint)]",
        "focus-visible:border-[var(--brand-orange)] focus-visible:shadow-[var(--shadow-brutal-focus)]",
        "disabled:cursor-not-allowed disabled:border-[var(--border-mid)] disabled:bg-surface-2 disabled:text-[var(--text-disabled)]",
        "aria-invalid:border-[var(--destructive)] aria-invalid:shadow-[var(--shadow-brutal-danger)]",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
