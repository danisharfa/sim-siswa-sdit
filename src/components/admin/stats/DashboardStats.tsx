'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FaUserTie,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaChalkboard,
  FaUsers,
} from 'react-icons/fa';

interface Props {
  totalCoordinator: number;
  totalTeachers: number;
  totalStudents: number;
  totalClassrooms: number;
  totalGroups: number;
}

export function DashboardStats({
  totalCoordinator,
  totalTeachers,
  totalStudents,
  totalClassrooms,
  totalGroups,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Koordinator</CardTitle>
          <FaUserTie className="w-10 h-10 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalCoordinator}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
          <FaChalkboardTeacher className="w-10 h-10 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalTeachers}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
          <FaUserGraduate className="w-10 h-10 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalStudents}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
          <FaChalkboard className="w-10 h-10 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalClassrooms}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Kelompok</CardTitle>
          <FaUsers className="w-10 h-10 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalGroups}</p>
        </CardContent>
      </Card>
    </div>
  );
}
