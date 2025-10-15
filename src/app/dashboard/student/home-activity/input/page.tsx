import { HomeActivityForm } from '@/components/student/home-activity/HomeActivityForm';

export default async function HomeActivityInputPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Input Aktivitas Rumah</h1>
      <HomeActivityForm />
    </div>
  );
}
