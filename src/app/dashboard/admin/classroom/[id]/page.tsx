import { ClassroomDetailsManagement } from '@/components/classroom-details/classroom-details-management';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ClassroomPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4">
      <Link href="/dashboard/admin/classroom">
        <Button variant="ghost">
          <ArrowLeft />
        </Button>
      </Link>
      <h1 className="text-2xl font-bold mb-4">Detail Kelas</h1>

      <ClassroomDetailsManagement classroomId={params.id} />
    </div>
  );
}
