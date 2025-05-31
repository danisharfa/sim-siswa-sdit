'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Props {
  groupId: string;
  classroomId: string;
  onMemberAdded: () => void;
}

interface StudentOption {
  id: string;
  nis: string;
  fullName: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AddGroupMembersForm({ groupId, classroomId, onMemberAdded }: Props) {
  const { data, isLoading } = useSWR(
    `/api/coordinator/student/available?classroomId=${classroomId}`,
    fetcher
  );
  const [selectedNis, setSelectedNis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const students: StudentOption[] = data?.data || [];

  const toggleSelect = (nis: string) => {
    setSelectedNis((prev) => (prev.includes(nis) ? prev.filter((s) => s !== nis) : [...prev, nis]));
  };

  const handleSubmit = async () => {
    if (selectedNis.length === 0) {
      toast.warning('Pilih minimal satu siswa');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/coordinator/group/${groupId}/member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nisList: selectedNis }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        toast.error(result.message || 'Gagal menambahkan siswa');
        return;
      }

      toast.success(result.message || 'Siswa berhasil ditambahkan');
      setSelectedNis([]);
      onMemberAdded();
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Tambah Siswa ke Kelompok</h2>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Memuat siswa...</p>
        ) : students.length === 0 ? (
          <p className="text-muted-foreground text-sm">Tidak ada siswa tersedia dalam kelas ini.</p>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-md p-2 max-h-64 overflow-y-auto space-y-2">
              {students.map((siswa) => (
                <label key={siswa.nis} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedNis.includes(siswa.nis)}
                    onCheckedChange={() => toggleSelect(siswa.nis)}
                  />
                  <span>
                    {siswa.fullName} ({siswa.nis})
                  </span>
                </label>
              ))}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || selectedNis.length === 0}
              className="w-full"
            >
              {loading ? 'Menambahkan...' : 'Tambah Siswa Terpilih'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
