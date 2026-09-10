// Dev credit badge — surfaces the project creator across every page.
import { ArrowUpRightIcon } from "lucide-react"

export const PROJECT_AUTHOR = "Herman El-maestro"
export const PORTFOLIO_URL = "https://my-portfolio-7v1e.onrender.com/"

export function DevBadge() {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 select-none">
      <a
        href={PORTFOLIO_URL}
        target="_blank"
        rel="noopener noreferrer"
        title={`View ${PROJECT_AUTHOR}'s portfolio`}
        aria-label={`Built by ${PROJECT_AUTHOR} — open portfolio in a new tab`}
        className="group pointer-events-auto inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 no-underline shadow-[3px_3px_0_0_#111111] transition-transform hover:-translate-y-0.5 hover:bg-[var(--brand-orange)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        <span className="h-2 w-2 shrink-0 bg-[var(--brand-orange)]" />
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-black">
          Built by{" "}
          <span className="text-[var(--brand-orange)] underline decoration-2 underline-offset-2 group-hover:text-white">
            {PROJECT_AUTHOR}
          </span>
        </span>
        <ArrowUpRightIcon className="size-3 shrink-0 text-black" aria-hidden="true" />
      </a>
    </div>
  )
}
