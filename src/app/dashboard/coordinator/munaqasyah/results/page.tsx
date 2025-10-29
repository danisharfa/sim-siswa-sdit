import { MunaqasyahResultManagement } from '@/components/coordinator/munaqasyah/result/MunaqasyahResultManagement';

export default function CoordinatorMunaqasyahResultPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Penilaian Munaqasyah</h1>
      <MunaqasyahResultManagement />
    </div>
  );
}
