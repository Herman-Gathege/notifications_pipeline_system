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
  const title = pageTitles[path] || "FikaTu"

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b-2 border-black bg-white transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <SidebarTrigger className="-ml-1 rounded-none border-2 border-black bg-white hover:bg-[var(--brand-orange)] hover:text-white shadow-[2px_2px_0_0_#111111]" />
        <Separator orientation="vertical" className="mx-1 h-5 bg-black" />
        <span className="hidden text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground sm:inline">
          FikaTu
        </span>
        <Separator orientation="vertical" className="mx-1 hidden h-5 bg-black sm:inline-block" />
        <h1 className="text-base font-black uppercase tracking-tight text-black">{title}</h1>
      </div>
    </header>
  )
}