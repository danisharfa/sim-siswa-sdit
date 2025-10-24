'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Users, School, UserCheck } from 'lucide-react';
import useSWR from 'swr';

interface StudentInfo {
  id: string;
  name: string;
  nis: string;
  currentGroup: {
    id: string;
    name: string;
    className: string;
  } | null;
}

interface StudentInfoResponse {
  studentInfo: StudentInfo;
  currentPeriod: {
    academicYear: string;
    semester: string;
    label: string;
  };
  teachers: {
    id: string;
    name: string;
  }[];
}

type ApiResponse = {
  success: boolean;
  data?: StudentInfoResponse;
  error?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function StudentInfoCard() {
  const {
    data: response,
    error,
    isLoading,
  } = useSWR<ApiResponse>('/api/student/info', fetcher);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Info Siswa</CardTitle>
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
          <CardTitle>Info Siswa</CardTitle>
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
          <CardTitle>Info Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className=" text-muted-foreground">
            {response?.error || 'Tidak dapat memuat info siswa.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { studentInfo, currentPeriod, teachers } = response.data;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <User />
          Info Siswa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Student Identity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground">Nama</span>
            <span className="font-medium">{studentInfo.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground">NIS</span>
            <span className="font-medium">{studentInfo.nis}</span>
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          {/* Current Period */}
          <div className="flex items-center gap-2 mb-2">
            <School className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Tahun Akademik</span>
          </div>
          <div className="pl-6">
            <div className="font-medium">{currentPeriod.label}</div>
          </div>
        </div>

        {/* Group and Class Info */}
        {studentInfo.currentGroup && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Kelompok & Kelas</span>
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex items-center justify-between">
                <span className=" text-muted-foreground">Kelompok</span>
                <span className="font-medium">{studentInfo.currentGroup.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className=" text-muted-foreground">Kelas</span>
                <span className="font-medium">{studentInfo.currentGroup.className}</span>
              </div>
            </div>
          </div>
        )}

        {/* Teachers */}
        {teachers.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                Guru Pembimbing
                {teachers.length > 1 && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {teachers.length} guru
                  </Badge>
                )}
              </span>
            </div>
            <div className="pl-6 space-y-1">
              {teachers.map((teacher, index) => (
                <div key={teacher.id}>
                  <span className="text-muted-foreground">
                    {teachers.length > 1 ? `${index + 1}. ` : ''}
                  </span>
                  <span className="font-medium">{teacher.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No group info */}
        {!studentInfo.currentGroup && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className=" font-medium text-muted-foreground">Belum ada kelompok aktif</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
