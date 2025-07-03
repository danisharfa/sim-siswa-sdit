import { requireStudentRole } from '@/lib/auth/require-role';
import { HomeActivityManagement } from '@/components/student/home-activity/HomeActivityManagement';

export default async function StudentSubmissionHistoryPage() {
const user = await requireStudentRole();

  return (
    <div className="p-4">
      <div className="flex items-baseline gap-2 mb-4">
        <h1 className="text-2xl font-bold">Aktivitas Rumah</h1>
        <span className="text-muted-foreground">{user.profile?.nis}</span>
      </div>
      <HomeActivityManagement />
    </div>
  );
}
