'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Settings2, UserCog2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/layout/theme/theme-toggle';
import { signOut, useSession } from 'next-auth/react';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  url: string;
}

export function NavActions() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const role = session?.user.role || null;

  const accountPath = role ? `/dashboard/${role}/account` : '/dashboard/account';

  const menuItems: MenuItem[][] = [
    [
      {
        title: 'Akun',
        icon: UserCog2Icon,
        url: accountPath,
      },
      {
        title: 'Keluar',
        icon: LogOut,
        url: '/logout',
      },
    ],
  ];

  const handleClick = async (url: string) => {
    if (url === '/logout') {
      await signOut({ callbackUrl: '/' });
    } else {
      router.push(url);
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost">
            <Settings2 />
            Pengaturan
            <ChevronDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 overflow-hidden rounded-lg p-0" align="end">
          <Sidebar collapsible="none" className="bg-transparent">
            <SidebarContent>
              {menuItems.map((group, index) => (
                <SidebarGroup key={index} className="border-b last:border-none">
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.map((item, index) => (
                        <SidebarMenuItem key={index}>
                          <SidebarMenuButton
                            onClick={() => {
                              handleClick(item.url);
                              setIsOpen(false);
                            }}
                          >
                            <item.icon />
                            <span>{item.title}</span>
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
