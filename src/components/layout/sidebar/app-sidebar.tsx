'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar';

import { useUser } from '@/lib/context/user-context';
import { menuData } from '@/lib/sidebar-menu';
import { NavMain } from '@/components/layout/sidebar/nav-main';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useUser();
  const role = user?.role;
  const menuItems = role ? menuData[role as keyof typeof menuData] || [] : [];

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      {/* Header Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" aria-label="Home">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image
                    src="/logo-sekolah.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Sistem Informasi Monitoring</span>
                  <span className="truncate text-xs">SD IT Ulul Albab</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Konten Menu */}
      <SidebarContent>
        {role ? <NavMain items={menuItems} /> : <p className="px-4 py-2">Loading...</p>}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
