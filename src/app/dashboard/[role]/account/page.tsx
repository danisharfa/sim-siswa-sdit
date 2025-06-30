import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/get-session';
import { ChangePasswordForm } from '@/app/dashboard/[role]/account/form';

export default async function AccountPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const session = await getSession();

  if (!session?.user) return redirect('/');
  // if (!session?.user) return redirect('/login');

  const actualRole = session.user.role;

  if (role !== actualRole) {
    return redirect(`/dashboard/${actualRole}/account`);
  }

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <span className="text-muted-foreground">Akun</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
