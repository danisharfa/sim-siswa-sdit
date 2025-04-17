import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getGroupById } from '@/lib/data';
import { notFound } from 'next/navigation';

export default async function GroupDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const id = params.id;

  const kelompok = await getGroupById(id);

  if (!kelompok) return notFound();

  return (
    <div className="p-4">
      <Link href="/dashboard/admin/group">
        <Button variant="ghost">
          <ArrowLeft />
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-4">
        Kelas {kelompok.nama} - {kelompok.kelasId}
      </h1>

      {/* <ClassroomDetailsManagement kelasId={id} /> */}
      {/* <GroupDetailManagement kelompok={id} /> */}
    </div>
  );
}
