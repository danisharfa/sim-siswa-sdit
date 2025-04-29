'use client';

import { useUser } from '@/lib/context/user-context';

export default function StudentDashboardPage() {
  const user = useUser();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold">Student Dashboard</h1>
      <p className="mt-2 text-lg">Welcome, {user.namaLengkap}!</p>
    </div>
  );
}
