// dashboard/student/profile/page.tsx

import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TeacherProfileDetail from './TeacherProfileDetail';

export default async function StudentProfilePage() {
  const user = await getUser();

  if (!user || user.role !== 'teacher') {
    return redirect('/login');
  }

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">{user.namaLengkap}</h1>
        <span className="text-muted-foreground">Biodata</span>
      </div>
      <TeacherProfileDetail userId={user.id} />
    </div>
  );
}
