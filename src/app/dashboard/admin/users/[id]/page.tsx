import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserDetail } from '@/components/admin/user/user-detail';
import { getUserDetail } from '@/lib/datas/user';

type Params = Promise<{ id: string }>;

export default async function UserPage(props: { params: Params }) {
  const params = await props.params;
  const id = params.id;

  const user = await getUserDetail(id);
  if (!user) return notFound();

  return (
    <div className="p-4">
      <Link href="/dashboard/admin/users">
        <Button variant="ghost">
          <ArrowLeft />
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-4">
        {user.role === 'student' ? 'Siswa' : 'Guru'} - {user.namaLengkap}
      </h1>

      <UserDetail userId={id} />
    </div>
  );
}
