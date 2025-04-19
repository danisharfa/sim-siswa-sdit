import { UserManagement } from '@/components/admin/user/user-management';

export default function UsersPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manajemen Pengguna</h1>
      <UserManagement />
    </div>
  );
}
