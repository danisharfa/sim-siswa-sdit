import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ChangePasswordForm from '@/components/settings/change-password-form';

export default async function SettingsPage({
  params,
}: {
  params: { role: string };
}) {
  const { role } = await Promise.resolve(params);
  const user = await getUser();

  if (!role || !user || user.role !== role) {
    return redirect('/login');
  }

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">Account</h1>
        <span className="text-muted-foreground">{user.username}</span>
      </div>
      <ChangePasswordForm userId={user.id} />
    </div>
  );
}
