import { SidebarTrigger } from '@/components/ui/sidebar';
import { NavActions } from './nav-actions';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center gap-2 px-4 shadow-md border-b bg-background">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
      </div>
      <div className="ml-auto">
        <NavActions />
      </div>
    </header>
  );
}
