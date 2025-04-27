'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';

type NavItem = {
  title: string;
  url?: string;
  icon?: LucideIcon;
  children?: { title: string; url: string }[];
};

export function NavMain({ items = [] }: { items?: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.length > 0 ? (
            items.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.children && item.children.length > 0 ? (
                  <>
                    <SidebarMenuButton className="flex items-center gap-2">
                      {item.icon && <item.icon className="size-5" />}
                      <span className="truncate ">{item.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {item.children.map((child) => (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={child.url} className="truncate">
                              {child.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </>
                ) : (
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link
                      href={item.url ?? '#'}
                      className="flex items-center gap-2"
                    >
                      {item.icon && <item.icon className="size-5" />}
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))
          ) : (
            <p className="text-muted-foreground px-4 py-2">No menu available</p>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
