'use client';

import { useEffect, useState } from 'react';
import { AddGuruTesForm } from './add-guruTes-form';
import GuruTesTable from './guruTes-table';

interface GuruTes {
  id: string;
  guruId: string;
  aktif: boolean;
  guru: {
    nip: string;
    user: {
      namaLengkap: string;
      username: string;
    };
  };
}

export function GuruTesManagement() {
  const [guruTes, setGuruTes] = useState<GuruTes[]>([]);

  async function fetchGuruTes() {
    const res = await fetch('/api/admin/guruTes');
    const data = await res.json();
    console.log('Fetched Guru Tes Data:', data);
    setGuruTes(data.data);
  }

  useEffect(() => {
    fetchGuruTes();
  }, []);

  return (
    <div className="space-y-6">
      <AddGuruTesForm onUserAdded={fetchGuruTes} />
      <GuruTesTable data={guruTes} title="Daftar Guru Tes" onRefresh={fetchGuruTes} />
    </div>
  );
}
