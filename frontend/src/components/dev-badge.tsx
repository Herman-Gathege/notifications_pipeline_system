// Dev credit badge — surfaces the project creator across every page.
export const PROJECT_AUTHOR = "Herman El-maestro (https://my-portfolio-7v1e.onrender.com/)"

export function DevBadge() {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 select-none">
      <div className="pointer-events-auto inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[3px_3px_0_0_#111111] transition-transform hover:-translate-y-0.5">
        <span className="h-2 w-2 shrink-0 bg-[var(--brand-orange)]" />
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-black">
          Built by <span className="text-[var(--brand-orange)]">{PROJECT_AUTHOR}</span>
        </span>
      </div>
    </div>
  )
}
