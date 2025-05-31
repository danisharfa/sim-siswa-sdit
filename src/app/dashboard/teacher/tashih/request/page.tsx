import { TashihRequestForm } from '@/components/teacher/tashih/request/TashihRequestForm';

export default function TeacherTashihFormPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Permintaan Tashih Siswa</h1>
      <TashihRequestForm />
    </div>
  );
}
