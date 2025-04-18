'use client';

import { useEffect, useState } from 'react';
import { GroupTable } from '@/components/group/group-table';
import { AddGroupForm } from '@/components/group/add-group-form';

interface Group {
  id: string;
  namaKelompok: string;
  kelas: {
    namaKelas: string;
    tahunAjaran: string;
  };
  guruKelompok: {
    guru: {
      user: {
        namaLengkap: string;
      };
    };
  }[];
}

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([]);

  async function fetchGroups() {
    try {
      const res = await fetch('/api/group');
      const data = await res.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
      <AddGroupForm onGroupAdded={fetchGroups} />
      <GroupTable data={groups} onRefresh={fetchGroups} />
    </div>
  );
}
