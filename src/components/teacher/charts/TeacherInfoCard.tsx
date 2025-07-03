'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Users, School, UserCheck } from 'lucide-react';
import useSWR from 'swr';

interface TeacherInfo {
  id: string;
  name: string;
  nip: string;
  groups: {
    id: string;
    name: string;
    className: string;
    studentCount: number;
  }[];
}

interface TeacherInfoResponse {
  teacherInfo: TeacherInfo;
  currentPeriod: {
    academicYear: string;
    semester: string;
    label: string;
  };
  totalStudents: number;
  totalGroups: number;
}

type ApiResponse = {
  success: boolean;
  data?: TeacherInfoResponse;
  error?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TeacherInfoCard() {
  const {
    data: response,
    error,
    isLoading,
  } = useSWR<ApiResponse>('/api/teacher/info', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Info Guru</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Info Guru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response?.success || !response.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Info Guru</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {response?.error || 'Tidak dapat memuat info guru.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { teacherInfo, currentPeriod, totalStudents, totalGroups } = response.data;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <User />
          Info Guru
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Teacher Identity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground">Nama</span>
            <span className="font-medium">{teacherInfo.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground">NIP</span>
            <span className="font-medium">{teacherInfo.nip}</span>
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          {/* Current Period */}
          <div className="flex items-center gap-2 mb-2">
            <School className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Periode Saat Ini</span>
          </div>
          <div className="pl-6">
            <div className="font-medium">{currentPeriod.label}</div>
          </div>
        </div>

        {/* Statistics */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Statistik Bimbingan</span>
          </div>
          <div className="pl-6 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Kelompok</span>
              <Badge variant="outline" className="font-medium">
                {totalGroups} kelompok
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Siswa</span>
              <Badge variant="outline" className="font-medium">
                {totalStudents} siswa
              </Badge>
            </div>
          </div>
        </div>

        {/* Groups and Classes */}
        {teacherInfo.groups.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                Kelompok & Kelas yang Diampu
                <Badge variant="outline" className="ml-2 text-xs">
                  {teacherInfo.groups.length} kelompok
                </Badge>
              </span>
            </div>
            <div className="pl-6 space-y-2 max-h-32 overflow-y-auto">
              {teacherInfo.groups.map((group) => (
                <div key={group.id} className="border-b pb-1 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{group.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Kelas: {group.className}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {group.studentCount} siswa
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No groups info */}
        {teacherInfo.groups.length === 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">Belum ada kelompok aktif</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
