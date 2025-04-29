import { requireRole } from '@/lib/auth/require-role';
import { ChangePasswordForm } from '@/components/settings/change-password-form';

export default async function SettingsPage({ params }: { params: Promise<{ role: string }> }) {
  const resolvedParams = await params;
  const user = await requireRole(resolvedParams.role);

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <span className="text-muted-foreground">Akun</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChangePasswordForm userId={user.id} />
      </div>
    </div>
  );
}
