// Dev credit badge — surfaces the project creator across every page.
import { ArrowUpRightIcon } from "lucide-react"

export const PROJECT_AUTHOR = "Herman El-maestro"
export const PORTFOLIO_URL = "https://my-portfolio-7v1e.onrender.com/"

export function DevBadge() {
  return (
    <div className="pointer-events-none fixed right-3 bottom-3 z-40 select-none sm:right-4 sm:bottom-4">
      <a
        href={PORTFOLIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        title={`View ${PROJECT_AUTHOR}'s portfolio`}
        aria-label={`Built by ${PROJECT_AUTHOR} — open portfolio in a new tab`}
        className="group pointer-events-auto inline-flex items-center gap-1.5 rounded-none border-2 border-[var(--ink)] bg-surface-1 px-2 py-1 no-underline shadow-[var(--shadow-brutal-xs)] transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-[var(--brand-orange)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-orange)] sm:gap-2 sm:px-2.5 sm:py-1.5 sm:shadow-[var(--shadow-brutal-sm)]"
      >
        <span className="size-1.5 shrink-0 bg-[var(--brand-orange)] group-hover:bg-white sm:size-2" />
        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--ink)] group-hover:text-white sm:text-[10px] sm:tracking-[0.14em]">
          Built by{" "}
          <span className="text-[var(--brand-orange)] underline decoration-2 underline-offset-2 group-hover:text-white">
            {PROJECT_AUTHOR}
          </span>
        </span>
        <ArrowUpRightIcon
          className="size-2.5 shrink-0 text-[var(--ink-muted)] group-hover:text-white sm:size-3"
          aria-hidden="true"
        />
      </a>
    </div>
  )
}
