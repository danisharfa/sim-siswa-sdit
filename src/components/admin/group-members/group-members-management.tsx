'use client';

import { useCallback, useEffect, useState } from 'react';
import { AddMemberForm } from '@/components/admin/group-members/add-member-form';
import { GroupMembersTable } from '@/components/admin/group-members/group-members-table';

interface Siswa {
  id: string;
  nis: string;
  namaLengkap: string;
}

interface MemberApiResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    nis: string;
    user: {
      namaLengkap: string | null;
    } | null;
  }[];
}

export function GroupDetailsManagement({ groupId }: { groupId: string }) {
  const [siswa, setSiswa] = useState<Siswa[]>([]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/group/${groupId}/member`);
      const resJson: MemberApiResponse = await res.json();

      if (!resJson.success) {
        throw new Error(resJson.message || 'Gagal mengambil data');
      }

      const parsedStudents: Siswa[] = resJson.data.map((s) => ({
        id: s.id,
        nis: s.nis,
        namaLengkap: s.user?.namaLengkap || 'Tidak diketahui',
      }));

      setSiswa(parsedStudents);
    } catch (error) {
      console.error('Gagal mengambil data siswa kelompok:', error);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
      <AddMemberForm groupId={groupId} onMemberAdded={fetchMembers} />
      <GroupMembersTable
        data={siswa}
        title="Daftar Anggota Kelompok"
        groupId={groupId}
        onRefresh={fetchMembers}
      />
    </div>
  );
}
