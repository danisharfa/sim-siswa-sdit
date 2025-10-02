'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Semester } from '@prisma/client';

interface Student {
  id: string;
  nis: string;
  fullName: string;
}

interface PromoteSemesterDialogProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  students: Student[];
  currentAcademicYear: string;
  currentSemester: Semester;
  onConfirm: () => void;
}

export function PromoteSemesterDialog({
  open,
  onOpenChange,
  students,
  currentAcademicYear,
  currentSemester,
  onConfirm,
}: PromoteSemesterDialogProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedStudentIds([]);
    }
  }, [open]);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const promotableStudents = students;

  async function handlePromote() {
    if (selectedStudentIds.length === 0) {
      toast.error('Pilih minimal satu siswa.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/classroom/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          promoteBySemester: true,
          academicYear: currentAcademicYear,
          currentSemester,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Gagal mempromosikan siswa.');
      }

      toast.success(result.message || 'Siswa berhasil dipromosikan');
      onConfirm();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Naik Semester</AlertDialogTitle>
          <AlertDialogDescription>
            Pilih siswa yang akan dipindahkan ke semester berikutnya.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 max-h-[300px] overflow-y-auto border p-2 rounded-md">
          {promotableStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2">
              Tidak ada siswa yang dapat dipromosikan.
            </p>
          ) : (
            promotableStudents.map((siswa) => (
              <label key={siswa.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedStudentIds.includes(siswa.id)}
                  onCheckedChange={() => toggleStudent(siswa.id)}
                />
                <span>
                  {siswa.nis} - {siswa.fullName}
                </span>
              </label>
            ))
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handlePromote} disabled={loading}>
            {loading ? 'Memproses...' : 'Naik Semester'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
