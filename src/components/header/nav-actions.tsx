'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ChevronDown, LogOutIcon, Settings2, UserCog2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme/theme-toggle';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  action?: (router: AppRouterInstance) => void;
}

export function NavActions() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [role, setRole] = React.useState<string | null>(null);
  const router = useRouter();

  // Fetch user role from API /api/auth/me
  React.useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const user = await res.json();
          setRole(user.role);
        } else {
          console.error('Failed to fetch user data:', res.statusText);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    }
    fetchUser();
  }, []);

  // Tentukan route settings berdasarkan role
  const accountPath = role
    ? `/dashboard/${role}/account`
    : '/dashboard/account';

  const menuItems: MenuItem[][] = [
    [
      {
        label: 'Account',
        icon: UserCog2Icon,
        action: (router: AppRouterInstance) => {
          router.push(accountPath);
        },
      },
      {
        label: 'Logout',
        icon: LogOutIcon,
        action: async (router: AppRouterInstance) => {
          try {
            const res = await fetch('/api/auth/logout', { method: 'POST' });
            if (res.ok) {
              router.push('/login');
            }
          } catch (err) {
            console.error('Logout failed:', err);
          }
        },
      },
    ],
  ];

  return (
    <div className="flex items-center gap-2 text-sm">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost">
            <Settings2 />
            Settings
            <ChevronDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 overflow-hidden rounded-lg p-0"
          align="end"
        >
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarContent>
              {menuItems.map((group, index) => (
                <SidebarGroup key={index} className="border-b last:border-none">
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.map((item, index) => (
                        <SidebarMenuItem key={index}>
                          <SidebarMenuButton
                            onClick={() => item.action?.(router)}
                          >
                            <item.icon /> <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>
      <ThemeToggle />
    </div>
  );
}
