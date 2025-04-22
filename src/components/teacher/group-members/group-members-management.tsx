'use client';

import { useEffect, useState } from 'react';
import { GroupMembersTable } from '@/components/teacher/group-members/group-members-table';

interface Siswa {
  id: string;
  nis: string;
  namaLengkap: string;
}

export function GroupDetailsManagement({ groupId }: { groupId: string }) {
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      try {
        const res = await fetch(`/api/teacher/group/${groupId}/member`);

        const data = await res.json();

        if (data.success) {
          setSiswa(data.data);
        } else {
          console.error('Gagal:', data.error || data.message);
        }
      } catch (error) {
        console.error('Gagal mengambil data siswa kelompok:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, [groupId]);

  if (loading) return <p>Memuat data anggota kelompok...</p>;

  return (
    <div className="grid grid-cols-1 gap-6">
      <GroupMembersTable siswa={siswa} title="Daftar Anggota Kelompok" />
    </div>
  );
}
