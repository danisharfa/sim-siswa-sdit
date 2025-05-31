import { MunaqasyahRequestManagement } from '@/components/coordinator/munaqasyah/request/MunaqasyahRequestManagement';

export default function CoordinatorMunaqasyahRequestsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Permintaan Munaqasyah Siswa</h1>
      <MunaqasyahRequestManagement />
    </div>
  );
}
