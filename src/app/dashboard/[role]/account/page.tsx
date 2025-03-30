import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ChangePasswordForm from '@/components/settings/change-password-form';

type Params = Promise<{ role: string }>;

export default async function SettingsPage(props: { params: Params }) {
  const params = await props.params;
  const role = params.role;

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
