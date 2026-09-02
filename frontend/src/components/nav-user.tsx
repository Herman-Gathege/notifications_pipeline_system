import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { EllipsisVerticalIcon, CircleUserRoundIcon, LogOutIcon, ShieldCheckIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "@/contexts/auth-context"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar?: string
  }
}) {
  const navigate = useNavigate()
  const { isMobile } = useSidebar()
  const { logout, user: authUser } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/", { replace: true })
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U"

  const roleBadge = authUser?.role === "admin" ? "Admin" : "User"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted data-[state=open]:bg-muted" />
            }
          >
            <Avatar className="size-9 ring-2 ring-[var(--brand-orange)]/30">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="bg-black text-white font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            <EllipsisVerticalIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-none border-2 border-black shadow-[4px_4px_0_0_#000]"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-9 ring-2 ring-[var(--brand-orange)]/30">
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                    <AvatarFallback className="bg-black text-white font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                    <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-none border border-black bg-[var(--brand-orange)]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-orange)]">
                      <ShieldCheckIcon className="size-3" />
                      {roleBadge}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-black/10" />
            <DropdownMenuItem className="rounded-none focus:bg-[var(--brand-orange)]/10">
              <CircleUserRoundIcon />
              Account
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-black/10" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-none font-semibold text-[var(--brand-orange)] focus:bg-[var(--brand-orange)] focus:text-white"
            >
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}