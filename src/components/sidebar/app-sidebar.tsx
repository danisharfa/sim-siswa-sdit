'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavMain } from '@/components/sidebar/nav-main';
import { getClientUser } from '@/lib/auth-client';
import { menuData } from '@/lib/sidebar-menu';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const user = await getClientUser();
      if (user) setRole(user.role);
    };

    fetchRole();
  }, []);

  const menuItems = role ? menuData[role as keyof typeof menuData] || [] : [];

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" aria-label="Home">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  LOGO
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Sistem Informasi Monitoring
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    SD IT Ulul Albab
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {role ? (
          <NavMain items={menuItems} />
        ) : (
          <p className="px-4 py-2">Loading...</p>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
