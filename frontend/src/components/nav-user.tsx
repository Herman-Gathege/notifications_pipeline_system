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
              <SidebarMenuButton
                size="lg"
                className="h-auto rounded-none px-2 py-2 hover:bg-surface-2 aria-expanded:bg-surface-2 data-[state=open]:bg-surface-2"
              />
            }
          >
            <Avatar className="size-9 rounded-none border-2 border-[var(--ink)]">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="rounded-none bg-[var(--ink)] text-xs font-black text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-bold text-[var(--ink)]">{user.name}</span>
              <span className="truncate text-xs text-[var(--ink-muted)]">
                {user.email}
              </span>
            </div>
            <EllipsisVerticalIcon className="ml-auto size-4 shrink-0 text-[var(--ink-faint)]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-60"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
                  <Avatar className="size-9 rounded-none border-2 border-[var(--ink)]">
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                    <AvatarFallback className="rounded-none bg-[var(--ink)] text-xs font-black text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-[var(--ink)]">{user.name}</span>
                    <span className="truncate text-xs text-[var(--ink-muted)]">
                      {user.email}
                    </span>
                    <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-none border-2 border-[var(--brand-orange)] bg-[var(--brand-orange-soft)] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--brand-orange)]">
                      <ShieldCheckIcon className="size-3" />
                      {roleBadge}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <CircleUserRoundIcon />
              Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              variant="destructive"
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
