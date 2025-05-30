import { use } from 'react';
import { fetchGroupHistoryMembersForTeacher } from '@/lib/data/teacher/teacher-group-member';
import { GroupHistoryMembersTable } from './table';

export function GroupHistoryDetailsManagement({ groupId }: { groupId: string }) {
  const members = use(fetchGroupHistoryMembersForTeacher(groupId));

  return (
    <div className="space-y-6">
      <GroupHistoryMembersTable data={members} title="Daftar Anggota Kelompok" groupId={groupId} />
    </div>
  );
}
