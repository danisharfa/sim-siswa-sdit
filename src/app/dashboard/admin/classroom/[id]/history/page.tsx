import { notFound } from 'next/navigation';
import { getClassroomHistoryById } from '@/lib/data/classroom';
import { ClassroomMembersHistoryManagement } from '@/components/admin/classroom-members/history/ClassroomMembersHistoryManagement';
import { BackButton } from '@/components/ui/back-button';

type Params = Promise<{ id: string }>;

export default async function ClassroomHistoryDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const classroom = await getClassroomHistoryById(id);
  if (!classroom) return notFound();

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
        <div className="flex items-center mb-4 xl:mb-0">
          <BackButton href={`/dashboard/admin/classroom`} />
          <h1 className="text-2xl font-bold ml-4">
            Riwayat Kelas {classroom.name} - {classroom.academicYear} {classroom.semester}
          </h1>
        </div>
      </div>

      <ClassroomMembersHistoryManagement classroomId={id} />
    </div>
  );
}
