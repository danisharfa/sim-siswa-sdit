import { use } from 'react';
import { fetchGroupMembers } from '@/lib/data/teacher/teacher-group-member';
import { GroupMembersTable } from './GroupMembersTable';

export function GroupMembersManagement({ groupId }: { groupId: string }) {
  const members = use(fetchGroupMembers(groupId));

  return (
    <div className="space-y-6">
      <GroupMembersTable data={members} title="Daftar Anggota Kelompok" groupId={groupId} />
    </div>
  );
}
