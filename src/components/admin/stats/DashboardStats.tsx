'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FaUserTie,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaChalkboard,
  FaUsers,
  FaCalendarAlt,
} from 'react-icons/fa';

interface Props {
  totalCoordinator: number;
  totalTeachers: number;
  totalStudents: number;
  totalClassrooms: number;
  totalGroups: number;
  currentPeriod: {
    academicYear: string;
    semester: string;
  };
}

export function DashboardStats({
  totalCoordinator,
  totalTeachers,
  totalStudents,
  totalClassrooms,
  totalGroups,
  currentPeriod,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Current Period Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Tahun Akademik Saat Ini</CardTitle>
          <FaCalendarAlt className="w-10 h-10 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary">
            {currentPeriod.academicYear} - {currentPeriod.semester}
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Total Koordinator</CardTitle>
            <FaUserTie className="w-10 h-10 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{totalCoordinator}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Total Guru</CardTitle>
            <FaChalkboardTeacher className="w-10 h-10 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{totalTeachers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Total Siswa</CardTitle>
            <FaUserGraduate className="w-10 h-10 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{totalStudents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Total Kelas</CardTitle>
            <FaChalkboard className="w-10 h-10 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{totalClassrooms}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Total Kelompok</CardTitle>
            <FaUsers className="w-10 h-10 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{totalGroups}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
