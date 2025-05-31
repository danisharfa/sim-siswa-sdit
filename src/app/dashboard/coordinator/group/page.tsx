import { GroupManagement } from '@/components/coordinator/group/GroupManagement';

export default function GroupPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manajemen Kelompok</h1>
      <GroupManagement />
    </div>
  );
}
