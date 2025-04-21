'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GroupTable } from '@/components/group/group-table'; // Komponen tabel kelompok
import { getClientUser } from '@/lib/auth-client';

export default function TeacherGroupPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getClientUser();
      if (user) setUserId(user.id);
    };

    fetchUser();
  }, []);

  if (!userId) return <p className="p-4">Loading kelompok...</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kelompok Bimbingan</h1>
        <Button onClick={() => router.push('/dashboard/teacher/group/new')}>
          Tambah Kelompok
        </Button>
      </div>
      {/* <GroupTable teacherId={userId} /> */}
    </div>
  );
}
