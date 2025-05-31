import { ClassroomManagement } from '@/components/admin/classroom/ClassroomManagement';

export default function ClassroomPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manajemen Kelas</h1>
      <ClassroomManagement />
    </div>
  );
}
