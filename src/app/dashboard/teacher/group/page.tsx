import { GroupManagement } from '@/components/teacher/group/group-management';

export default function TeacherGroupPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Kelompok Bimbingan</h1>
      <GroupManagement />
    </div>
  );
}
