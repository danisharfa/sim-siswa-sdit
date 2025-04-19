'use client';

import { useEffect, useState } from 'react';
import { ClassroomTable } from '@/components/admin/classroom/classroom-table';
import { AddClassroomForm } from '@/components/admin/classroom/add-classroom-form';

interface Kelas {
  id: string;
  namaKelas: string;
  tahunAjaran: string;
}

export function ClassroomManagement() {
  const [kelas, setKelas] = useState<Kelas[]>([]);

  async function fetchKelas() {
    try {
      const res = await fetch('/api/classroom');
      if (!res.ok) throw new Error('Failed to fetch kelas data');
      const data = await res.json();
      setKelas(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchKelas();
  }, []);

  return (
    <div className="space-y-6">
      {/* // <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
      <AddClassroomForm onKelasAdded={fetchKelas} />
      <ClassroomTable data={kelas} onRefresh={fetchKelas} />
      {/* </div> */}
    </div>
  );
}
