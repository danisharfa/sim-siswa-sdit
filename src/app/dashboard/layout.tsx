import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/header/app-header';
import { AppSidebar } from '@/components/layout/sidebar/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserContextProvider } from '@/lib/context/user-context';
import { auth } from '@/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    return redirect('/');
  }

  return (
    <UserContextProvider user={session.user}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="w-full sm:w-[calc(100vw-4rem)] md:w-[calc(100vw-6rem)] lg:w-[calc(100vw-20rem)]">
          <AppHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </UserContextProvider>
  );
}
