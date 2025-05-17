import { ClassroomManagement } from '@/components/admin/classroom/management';

export default function ClassroomPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manajemen Kelas</h1>
      <ClassroomManagement />
    </div>
  );
}
