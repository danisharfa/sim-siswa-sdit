import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { AppHeader } from '@/components/header/app-header';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    return redirect('/login');
  }

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
