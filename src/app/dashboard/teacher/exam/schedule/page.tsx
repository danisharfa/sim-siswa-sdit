import { TeacherExamScheduleManagement } from '@/components/teacher/exam/schedule/management';

export default function TeacherExamSchedulePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Daftar Ujian Siswa</h1>
      <TeacherExamScheduleManagement />
    </div>
  );
}
