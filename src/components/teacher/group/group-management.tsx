import { GroupTable } from './group-table';
import { fetchTeacherGroups } from '@/lib/data/teacher/teacher-group';
import { use } from 'react';

export function GroupManagement() {
  const groups = use(fetchTeacherGroups());

  return (
    <div className="space-y-6">
      <GroupTable data={groups} title="Daftar Kelompok" />
    </div>
  );
}
