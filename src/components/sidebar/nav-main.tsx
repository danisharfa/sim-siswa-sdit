'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavMain({
  items = [],
}: {
  items?: { title: string; url: string; icon?: LucideIcon }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.length > 0 ? (
            items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url} passHref>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className="flex items-center gap-2"
                  >
                    {item.icon && <item.icon className="size-10" />}
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </Link>
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
