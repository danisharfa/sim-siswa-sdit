'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

type BaseItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  exact?: boolean;
};

type GroupItem = {
  label: string;
  items: BaseItem[];
};

type NavItem = BaseItem | GroupItem;

const isActivePath = (href: string, pathname: string, exact?: boolean) => {
  if (exact) return pathname === href || pathname === href + '/';
  return pathname === href || pathname.startsWith(href + '/');
};

export function NavMain({ items = [] }: { items?: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarMenu className="px-2">
      {items.map((item, index) => {
        if ('label' in item) {
          return (
            <div key={item.label + index} className="mt-2">
              <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">
                {item.label}
              </SidebarGroupLabel>

              {item.items.map((sub) => {
                const subActive = isActivePath(sub.url, pathname, sub.exact);

                return (
                  <SidebarMenuItem key={sub.title}>
                    <SidebarMenuButton asChild tooltip={sub.title}>
                      <Link
                        href={sub.url}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors',
                          'hover:bg-muted hover:text-foreground',
                          subActive && 'bg-muted text-foreground'
                        )}
                        aria-current={subActive ? 'page' : undefined}
                      >
                        {sub.icon && <sub.icon className="size-4" />}
                        <span className="text-sm">{sub.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </div>
          );
        }

        const isActive = isActivePath(item.url, pathname, (item as BaseItem).exact);

        return (
          <SidebarMenuItem key={item.title + index}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link
                href={item.url}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors',
                  'hover:bg-muted hover:text-foreground',
                  isActive && 'bg-muted text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
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
