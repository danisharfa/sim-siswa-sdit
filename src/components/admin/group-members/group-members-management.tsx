'use client';

import { useCallback, useEffect, useState } from 'react';
import { AddMemberForm } from '@/components/admin/classroom-members/add-member-form';
import { ClassroomMembersTable } from '@/components/admin/classroom-members/classroom-members-table';

interface Kelompok {
  id: string;
  namaKelompok: string;
  kelasId: string;
}

export function ClassroomDetailsManagement({ id }: { id: string }) {
  const [kelompok, setKelompok] = useState<Kelompok[]>([]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/group/${id}/members`);
      const students = await res.json();

      interface Student {
        id: string;
        nis: string;
        user?: {
          namaLengkap?: string;
        };
      }

      const parsedStudents = students.map((s: Student) => ({
        id: s.id,
        nis: s.nis,
        namaLengkap: s.user?.namaLengkap || 'Tidak diketahui',
      }));

      setSiswa(parsedStudents);
    } catch (error) {
      console.error('Gagal mengambil data siswa:', error);
    }
  }, [kelasId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
      <AddMemberForm kelasId={kelasId} onMemberAdded={fetchMembers} />
      <ClassroomMembersTable
        siswa={siswa}
        title="Daftar Siswa"
        kelasId={kelasId}
        fetchMembers={fetchMembers}
      />
    </div>
  );
}
