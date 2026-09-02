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
      <SidebarHeader className="border-b-2 border-black bg-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-2!"
              render={<a href="/dashboard" />}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-none border-2 border-black bg-[var(--brand-orange)] text-white shadow-[3px_3px_0_0_#000]">
                <span className="text-sm font-black">FT</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-black uppercase tracking-tight text-black">FikaTu</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-orange)]">
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
      <SidebarFooter className="border-t-2 border-black bg-white">
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}