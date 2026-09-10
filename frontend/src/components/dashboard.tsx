import { Outlet } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import { DevBadge } from "@/components/dev-badge"
import { SiteHeader } from "@/components/site-header"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Dashboard() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <SiteHeader />

        {/* min-w-0 keeps wide data tables from stretching the shell */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>

      {/* Dev credit badge — shown on every authenticated page */}
      <DevBadge />
    </SidebarProvider>
  )
}
