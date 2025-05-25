'use client';

import Link from 'next/link';
import {
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

type BaseItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type GroupItem = {
  label: string;
  items: BaseItem[];
};

type NavItem = BaseItem | GroupItem;

export function NavMain({ items = [] }: { items?: NavItem[] }) {
  return (
    <SidebarMenu className="px-2">
      {items.map((item, index) => {
        if ('label' in item) {
          return (
            <div key={item.label + index} className="mt-2">
              <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground mb-1">
                {item.label}
              </SidebarGroupLabel>
              {item.items.map((sub) => (
                <SidebarMenuItem key={sub.title}>
                  <SidebarMenuButton asChild tooltip={sub.title}>
                    <Link
                      href={sub.url}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted"
                    >
                      {sub.icon && <sub.icon className="size-4" />}
                      <span className="text-sm">{sub.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          );
        }

        // For single item (like Dashboard)
        return (
          <SidebarMenuItem key={item.title + index}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link
                href={item.url}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted"
              >
                {item.icon && <item.icon className="size-4" />}
                <span className="text-sm">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
