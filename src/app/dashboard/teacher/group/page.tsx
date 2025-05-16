// import { GroupManagement } from '@/components/teacher/group/group-management';

// export default function TeacherGroupPage() {
//   return (
//     <div className="p-4">
//       <h1 className="text-2xl font-bold mb-4">Kelompok Bimbingan</h1>
//       <GroupManagement />
//     </div>
//   );
// }

import { Suspense } from 'react';
import { GroupManagement } from '@/components/teacher/group/group-management';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherGroupPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Kelompok Bimbingan</h1>
      <Suspense fallback={<Skeleton className="h-150 w-full" />}>
        <GroupManagement />
      </Suspense>
    </div>
  );
}
