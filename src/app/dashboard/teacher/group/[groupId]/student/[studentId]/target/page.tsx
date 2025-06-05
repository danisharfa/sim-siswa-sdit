import { notFound } from 'next/navigation';
import { getStudent } from '@/lib/data/teacher/teacher-group-member';
import { BackButton } from '@/components/ui/back-button';
import { TargetManagement } from '@/components/teacher/weekly-target/TargetManagement';

type Params = Promise<{ groupId: string; studentId: string }>;

export default async function TargetPage(props: { params: Params }) {
  const params = await props.params;
  const { groupId, studentId } = params;

  const data = await getStudent(groupId, studentId);
  if (!data) return notFound();

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <BackButton href={`/dashboard/teacher/group/${groupId}`} />
        <div className="ml-4">
          <h1 className="text-2xl font-bold">
            Target Mingguan: {data.user.fullName} ({data.nis})
          </h1>
          <div className="text-sm text-muted-foreground mt-1">
            <span>{data.group?.name || 'Tidak ada kelompok'}</span>
            <span className="mx-2">•</span>
            <span>{data.group?.classroom?.name || 'Tidak ada kelas'}</span>
            <span className="mx-2">•</span>
            <span>
              {data.group?.classroom?.academicYear} - {data.group?.classroom?.semester}
            </span>
          </div>
        </div>
      </div>

      <TargetManagement student={data} />
    </div>
  );
}
