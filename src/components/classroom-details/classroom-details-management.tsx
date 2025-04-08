'use client';

import { useEffect, useState } from 'react';
import { AddMemberForm } from './add-member-form';
import { ClassroomDetails } from './classroom-details';

interface Siswa {
  id: string;
  nis: string;
  namaLengkap: string;
}

interface Guru {
  id: string;
  nip: string | null;
  namaLengkap: string;
}

export function ClassroomDetailsManagement({
  classroomId,
}: {
  classroomId: string;
}) {
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);

  async function fetchGuruDanSiswa() {
    const [guruRes, siswaRes] = await Promise.all([
      fetch(`/api/classroom/${classroomId}/teacher`).then((res) => res.json()),
      fetch(`/api/classroom/${classroomId}/student`).then((res) => res.json()),
    ]);

    setGuruList(
      guruRes.map(
        (g: {
          guru: {
            id: string;
            nip: string;
            user?: { namaLengkap?: string };
          };
        }) => ({
          id: g.guru.id,
          nip: g.guru.nip,
          namaLengkap: g.guru.user?.namaLengkap || 'Tidak diketahui',
        })
      )
    );

    setSiswaList(
      siswaRes.map(
        (siswa: {
          id: string;
          nis: string;
          user?: { namaLengkap?: string };
        }) => ({
          id: siswa.id,
          nis: siswa.nis,
          namaLengkap: siswa.user?.namaLengkap || 'Tidak diketahui',
        })
      )
    );
  }

  useEffect(() => {
    fetchGuruDanSiswa();
  }, [classroomId]);

  return (
    <div className="space-y-6 mt-6">
      <AddMemberForm kelasId={classroomId} onMemberAdded={fetchGuruDanSiswa} />
      <ClassroomDetails guruList={guruList} siswaList={siswaList} />
    </div>
  );
}
