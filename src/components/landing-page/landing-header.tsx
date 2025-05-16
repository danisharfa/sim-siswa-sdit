'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export function LandingHeader() {
  return (
    <header className="px-4 py-3 border-b shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-12 items-center justify-center">
              <Image src="/logo-sekolah.png" alt="Logo" width={48} height={48} />
            </div>
            Sistem Informasi Monitoring
          </Link>
        </div>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Button asChild>
                <Link href="/login" className="flex items-center gap-2">
                  <LogIn className="size-4" />
                  Masuk
                </Link>
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}
