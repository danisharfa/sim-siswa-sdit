import { use } from 'react';
import { fetchGroupMembersForTeacher } from '@/lib/data/teacher/teacher-group-member';
import { GroupMembersTable } from './table';

export function GroupDetailsManagement({ groupId }: { groupId: string }) {
  const members = use(fetchGroupMembersForTeacher(groupId));

  return (
    <div className="space-y-6">
      <GroupMembersTable data={members} title="Daftar Anggota Kelompok" groupId={groupId} />
    </div>
  );
}
