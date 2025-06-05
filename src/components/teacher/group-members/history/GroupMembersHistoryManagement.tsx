import { use } from 'react';
import { fetchGroupHistoryMembers } from '@/lib/data/teacher/teacher-group-member';
import { GroupMembersHistoryTable } from './GroupMembersHistoryTable';

export function GroupMembersHistoryManagement({ groupId }: { groupId: string }) {
  const members = use(fetchGroupHistoryMembers(groupId));

  return (
    <div className="space-y-6">
      <GroupMembersHistoryTable data={members} title="Daftar Anggota Kelompok" groupId={groupId} />
    </div>
  );
}
