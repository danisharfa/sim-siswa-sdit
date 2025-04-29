'use client';

import { redirect } from 'next/navigation';
import { useUser } from '@/lib/context/user-context';
import StudentProfileDetail from '@/components/student/profile/detail';

export default function StudentProfilePage() {
  const user = useUser();

  if (!user || user.role !== 'student') {
    return redirect('/login');
  }

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">{user.namaLengkap}</h1>
        <span className="text-muted-foreground">Biodata</span>
      </div>
      <StudentProfileDetail userId={user.id} />
    </div>
  );
}
