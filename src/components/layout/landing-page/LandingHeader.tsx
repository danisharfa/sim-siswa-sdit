import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 transition-transform hover:scale-105">
          <div className="relative flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 p-1">
            <Image 
              src="/logo-sekolah.png" 
              alt="Logo SDIT Ulul Albab" 
              width={32} 
              height={32}
              className="rounded-md"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              SIM-Qur&apos;an
            </span>
            <span className="text-xs text-muted-foreground">SDIT Ulul Albab Mataram</span>
          </div>
        </Link>

        {/* Login Button */}
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/login" className="flex items-center gap-2">
              <LogIn className="size-4" />
              Masuk
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}