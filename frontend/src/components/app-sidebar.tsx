import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
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
  LogOutIcon,
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

const navSecondary = [
  {
    title: "Logout",
    url: "#",
    icon: <LogOutIcon />,
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
        name: "Admin",
        email: "admin@fikatu.com",
      }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <img src="/FikaTu-logo.png" alt="FikaTu" className="h-8 w-auto" />
              <span className="text-base font-semibold">FikaTu</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
