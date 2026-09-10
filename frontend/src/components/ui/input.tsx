import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-none border-2 border-[var(--ink)] bg-surface-1 px-3 text-base shadow-none transition-[border-color,box-shadow,background-color] duration-150 outline-none",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-foreground",
        "placeholder:text-[var(--ink-faint)]",
        "hover:border-[var(--ink)]",
        "focus-visible:border-[var(--brand-orange)] focus-visible:shadow-[var(--shadow-brutal-focus)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[var(--border-mid)] disabled:bg-surface-2 disabled:text-[var(--text-disabled)]",
        "aria-invalid:border-[var(--destructive)] aria-invalid:shadow-[var(--shadow-brutal-danger)]",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
