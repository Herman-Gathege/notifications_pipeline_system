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
import { LayoutDashboardIcon, FolderIcon, ServerIcon, FileTextIcon, SendIcon, BellIcon, BarChart3Icon, FileChartColumnIcon, LogOutIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Applications",
    url: "/applications",
    icon: <FolderIcon />,
  },
  {
    title: "Providers",
    url: "/providers",
    icon: <ServerIcon />,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: <FileTextIcon />,
  },
  {
    title: "Events",
    url: "/events",
    icon: <SendIcon />,
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: <BellIcon />,
  },
  {
    title: "Monitoring",
    url: "/monitoring",
    icon: <BarChart3Icon />,
  },
  {
    title: "Reports",
    url: "/reports",
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

  const currentUser = user
    ? {
        name: user.name,
        email: user.email,
        avatar: "/avatars/shadcn.jpg",
      }
    : {
        name: "Admin",
        email: "admin@notification-platform",
        avatar: "/avatars/shadcn.jpg",
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
              <span className="text-base font-semibold">Notify Platform</span>
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
