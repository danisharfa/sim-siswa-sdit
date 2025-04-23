'use client';

import { useEffect, useState } from 'react';
import { GroupTable } from './group-table';

interface Group {
  id: string;
  namaKelompok: string;
  kelas: {
    namaKelas: string;
    tahunAjaran: string;
  };
  totalAnggota: number;
}

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchGroups() {
    setLoading(true);
    try {
      const res = await fetch('/api/group/teacher');
      const data = await res.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error('Gagal mengambil data kelompok:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  if (loading) return <p>Memuat data kelompok...</p>;

  return (
    <div className="space-y-6">
      <GroupTable data={groups} title="Daftar Kelompok" />
    </div>
  );
}
