'use client';

import * as React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  LayoutDashboardIcon,
  MonitorCogIcon,
  UsersRoundIcon,
} from 'lucide-react';

import { NavMain } from '@/components/sidebar/nav-main';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar';

const menuData = {
  admin: [
    {
      title: 'Dashboard',
      url: '/dashboard/admin',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Manajemen Pengguna',
      url: '/dashboard/admin/users',
      icon: UsersRoundIcon,
    },
    {
      title: 'Monitoring Setoran',
      url: '/dashboard/admin/monitoring',
      icon: MonitorCogIcon,
    },
  ],
  teacher: [
    {
      title: 'Guru',
      url: '/dashboard/teacher',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Data Siswa',
      url: '/dashboard/teacher/students',
      icon: UsersRoundIcon,
    },
    {
      title: 'Rekap Setoran',
      url: '/dashboard/teacher/recap',
      icon: MonitorCogIcon,
    },
  ],
  student: [
    {
      title: 'Siswa',
      url: '/dashboard/student',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Setoran Saya',
      url: '/dashboard/student/submission',
      icon: MonitorCogIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [role, setRole] = useState<string | null>(null);

  // Fetch user role from API
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch('/api/auth/me'); // Fetch data from API
        const data = await res.json();
        setRole(data.role); // Set role from response
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
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
