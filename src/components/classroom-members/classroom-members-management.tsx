'use client';

import { useEffect, useState } from 'react';
import { AddMemberForm } from '@/components/classroom-members/add-member-form';
import { ClassroomMembersTable } from './classroom-members-table';

interface Member {
  id: string;
  identifier: string;
  namaLengkap: string;
  role: 'teacher' | 'student';
}

export function ClassroomDetailsManagement({ kelasId }: { kelasId: string }) {
  const [members, setMembers] = useState<Member[]>([]);

  const fetchMembers = async () => {
    try {
      const [teacherRes, studentRes] = await Promise.all([
        fetch(`/api/classroom/${kelasId}/teacher`),
        fetch(`/api/classroom/${kelasId}/student`),
      ]);

      const [teachers, students] = await Promise.all([
        teacherRes.json(),
        studentRes.json(),
      ]);

      interface Teacher {
        guru: {
          id: string;
          nip?: string;
          user?: {
            namaLengkap?: string;
          };
        };
      }

      const parsedTeachers = teachers.map((g: Teacher) => ({
        id: g.guru.id,
        identifier: g.guru.nip || '-',
        namaLengkap: g.guru.user?.namaLengkap || 'Tidak diketahui',
        role: 'teacher',
      }));

      interface Student {
        id: string;
        nis: string;
        user?: {
          namaLengkap?: string;
        };
      }

      const parsedStudents = students.map((s: Student) => ({
        id: s.id,
        identifier: s.nis,
        namaLengkap: s.user?.namaLengkap || 'Tidak diketahui',
        role: 'student',
      }));

      setMembers([...parsedTeachers, ...parsedStudents]);
    } catch (err) {
      console.error('Gagal mengambil data anggota:', err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [kelasId]);

  return (
    <div className="space-y-6">
      <AddMemberForm kelasId={kelasId} onMemberAdded={fetchMembers} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClassroomMembersTable
          members={members}
          title="Daftar Guru"
          role="teacher"
        />
        <ClassroomMembersTable
          members={members}
          title="Daftar Siswa"
          role="student"
        />
      </div>
    </div>
  );
}
