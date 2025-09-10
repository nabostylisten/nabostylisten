"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { getSidebarItems } from "@/components/profile-sidebar";
import { adminSidebarItems } from "@/components/admin-sidebar";
import { isAdmin } from "@/lib/permissions";
import { LogOut } from "lucide-react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

interface UserDropdownProps {
  user: User;
  profile: any;
  onSignOut: () => void;
}

export function UserDropdown({ user, profile, onSignOut }: UserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <CurrentUserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {getSidebarItems(profile?.role).map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                href={`/profiler/${user.id}${item.href}`}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {item.title}
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        {profile && isAdmin(profile.role) && (
          <>
            {adminSidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={onSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logg ut
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}