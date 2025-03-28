import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';

export default async function StudentDashboard() {
  const user = await getUser();

  if (!user || user.role !== 'student') {
    return redirect('/login');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-3xl font-bold">Student Dashboard</h1>
      <p className="mt-2 text-lg">Welcome, {user.username}!</p>
    </div>
  );
}
