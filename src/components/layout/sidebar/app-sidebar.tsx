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
                  <span className="truncate font-semibold">SIM-Qur&apos;an</span>
                  <span className="truncate text-xs">SDIT Ulul Albab Mataram</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {role ? <NavMain items={menuItems} /> : <p className="px-4 py-2">Loading...</p>}
      </SidebarContent>
    </Sidebar>
  );
}
