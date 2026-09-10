import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  FolderIcon,
  ServerIcon,
  FileTextIcon,
  SendIcon,
  BellIcon,
  BarChart3Icon,
  FileChartColumnIcon,
  UsersIcon,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const baseNavMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Applications",
    url: "/dashboard/applications",
    icon: <FolderIcon />,
  },
  {
    title: "Providers",
    url: "/dashboard/providers",
    icon: <ServerIcon />,
  },
  {
    title: "Templates",
    url: "/dashboard/templates",
    icon: <FileTextIcon />,
  },
  {
    title: "Events",
    url: "/dashboard/events",
    icon: <SendIcon />,
  },
  {
    title: "Notifications",
    url: "/dashboard/notifications",
    icon: <BellIcon />,
  },
  {
    title: "Monitoring",
    url: "/dashboard/monitoring",
    icon: <BarChart3Icon />,
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: <FileChartColumnIcon />,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const navMain = [...baseNavMain]
  if (user?.role === "admin") {
    navMain.push({
      title: "Users",
      url: "/dashboard/users",
      icon: <UsersIcon />,
    })
  }

  const currentUser = user
    ? {
        name: user.name,
        email: user.email,
      }
    : {
        name: "Guest",
        email: "Not signed in",
      }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b-2 border-[var(--border-soft)] px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-auto gap-3 px-2 py-2 hover:bg-transparent data-[slot=sidebar-menu-button]:p-2!"
              render={<a href="/dashboard" />}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-none border-2 border-[var(--ink)] bg-[var(--brand-orange)] text-white shadow-[var(--shadow-brutal-xs)]">
                <span className="text-sm font-black tracking-tight">FT</span>
              </div>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-black uppercase tracking-tight text-[var(--ink)]">
                  FikaTu
                </span>
                <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-orange)]">
                  Notifications
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t-2 border-[var(--border-soft)] p-2">
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
