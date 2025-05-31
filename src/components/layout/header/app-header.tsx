import { SidebarTrigger } from '@/components/ui/sidebar';
import { NavActions } from '@/components/layout/header/nav-actions';
import { Separator } from '@/components/ui/separator';

export function AppHeader() {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-18 flex h-18 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <div className="ml-auto">
          <NavActions />
        </div>
      </div>
    </header>
  );
}
