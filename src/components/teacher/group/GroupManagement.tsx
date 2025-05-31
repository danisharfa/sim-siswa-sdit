import { use } from 'react';
import { fetchTeacherGroups, fetchTeacherGroupHistory } from '@/lib/data/teacher/teacher-group';
import { GroupTable } from '@/components/teacher/group/GroupTable';
import { GroupHistoryTable } from '@/components/teacher/group/GroupHistoryTable';

export function GroupManagement() {
  const groups = use(fetchTeacherGroups());
  const groupHistory = use(fetchTeacherGroupHistory());

  return (
    <div className="space-y-6">
      <GroupTable data={groups} title="Daftar Kelompok" />
      <GroupHistoryTable data={groupHistory} title="Riwayat Kelompok" />
    </div>
  );
}
