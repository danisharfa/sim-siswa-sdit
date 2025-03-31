import { notFound } from 'next/navigation';
import { UserDetail } from '@/components/user/user-detail';
import { getUserById } from '@/lib/data';

type Params = Promise<{ id: string }>;

export default async function UserDetailPage(props: { params: Params }) {
  const params = await props.params;
  const id = params.id;

  const user = await getUserById(id);

  if (!user) return notFound();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Detail Pengguna</h1>
      <UserDetail user={user} />
    </div>
  );
}
