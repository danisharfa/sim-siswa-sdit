'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { PromoteSemesterDialog } from './promote-semester-dialog';
import { Button } from '@/components/ui/button';
import { Semester } from '@prisma/client';

interface Student {
  id: string;
  nis: string;
  fullName: string;
}

interface Props {
  classroomId: string;
  currentAcademicYear: string;
  currentSemester: Semester;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PromoteDialogWrapper({ classroomId, currentAcademicYear, currentSemester }: Props) {
  const [open, setOpen] = useState(false);

  const {
    data: studentData,
    isLoading: loadingStudents,
    mutate,
  } = useSWR(open ? `/api/admin/classroom/${classroomId}/member` : null, fetcher);

  const students: Student[] = studentData?.data || [];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setOpen(true)} variant="default" disabled={loadingStudents}>
          Naik Semester
        </Button>
      </div>

      <PromoteSemesterDialog
        open={open}
        onOpenChange={setOpen}
        students={students}
        currentAcademicYear={currentAcademicYear}
        currentSemester={currentSemester}
        onConfirm={() => {
          setOpen(false);
          mutate();
        }}
      />
    </>
  );
}
