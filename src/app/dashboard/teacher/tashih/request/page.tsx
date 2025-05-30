import { TashihForm } from '@/components/teacher/tashih/request/tashih-form';

export default function TeacherTashihFormPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Permintaan Tashih Siswa</h1>
      <TashihForm />
    </div>
  );
}
