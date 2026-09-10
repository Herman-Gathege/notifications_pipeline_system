import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useLocation } from "react-router-dom"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/applications": "Applications",
  "/dashboard/providers": "Providers",
  "/dashboard/templates": "Templates",
  "/dashboard/events": "Events",
  "/dashboard/notifications": "Notifications",
  "/dashboard/monitoring": "Monitoring",
  "/dashboard/reports": "Reports",
  "/dashboard/users": "Users",
}

export function SiteHeader() {
  const location = useLocation()
  const path = location.pathname
  const title = pageTitles[path] || "Dashboard"
  const isRoot = path === "/dashboard"

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b-2 border-[var(--ink)] bg-surface-1">
      <div className="flex w-full min-w-0 items-center gap-3 px-4 md:px-6 lg:px-8">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="hidden h-6 bg-[var(--border-mid)] sm:block"
        />
        {/* Breadcrumb replaces the old duplicated page heading */}
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-2">
            <li className="hidden shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-faint)] sm:block">
              FikaTu
            </li>
            <li
              aria-hidden="true"
              className="hidden shrink-0 text-[var(--ink-faint)] sm:block"
            >
              /
            </li>
            <li
              aria-current={isRoot ? "page" : undefined}
              className="min-w-0 truncate text-sm font-black uppercase tracking-[0.06em] text-[var(--ink)]"
            >
              {title}
            </li>
          </ol>
        </nav>
      </div>
    </header>
  )
}
