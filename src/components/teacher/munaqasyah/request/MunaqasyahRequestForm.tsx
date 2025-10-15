'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import { Semester, MunaqasyahStage, MunaqasyahBatch } from '@prisma/client';

interface Group {
  groupId: string;
  groupName: string;
  classroomName: string;
  classroomAcademicYear: string;
  classroomSemester: Semester;
}

interface Student {
  id: string;
  fullName: string;
}

interface Juz {
  id: number;
  name: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MunaqasyahRequestForm() {
  const [loading, setLoading] = useState(false);

  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [juzList, setJuzList] = useState<Juz[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedJuzId, setSelectedJuzId] = useState<number | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<MunaqasyahBatch | ''>('');

  const { data: settingData } = useSWR('/api/academicSetting', fetcher);

  const filteredGroups = useMemo(() => {
    if (!settingData?.data) return [];
    const { currentYear, currentSemester } = settingData.data;
    return groups.filter(
      (g) => g.classroomAcademicYear === currentYear && g.classroomSemester === currentSemester
    );
  }, [groups, settingData]);

  useEffect(() => {
    const fetchInitial = async () => {
      const [groupRes, juzRes] = await Promise.all([
        fetch('/api/teacher/group'),
        fetch('/api/juz'),
      ]);
      const [groupJson, juzJson] = await Promise.all([groupRes.json(), juzRes.json()]);
      if (groupJson.success) setGroups(groupJson.data);
      if (juzJson.success) setJuzList(juzJson.data);
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (!selectedGroupId) return;
    const fetchStudents = async () => {
      const res = await fetch(`/api/teacher/group/${selectedGroupId}/member`);
      const json = await res.json();
      if (json.success) setStudents(json.data);
    };
    fetchStudents();
  }, [selectedGroupId]);

  const handleSubmit = async () => {
    if (!selectedStudentId || !selectedJuzId || !selectedBatch) {
      toast.error('Lengkapi semua data terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/munaqasyah/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          juzId: selectedJuzId,
          batch: selectedBatch,
          stage: MunaqasyahStage.TASMI,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Permintaan Munaqasyah berhasil dikirim');
        setSelectedGroupId('');
        setSelectedStudentId('');
        setSelectedJuzId(null);
        setSelectedBatch('');
      } else {
        toast.error(json.message ?? 'Gagal mengirim permintaan');
      }
    } catch (error) {
      console.error('[MUNAQASYAH_REQUEST_SUBMIT]', error);
      toast.error('Terjadi kesalahan saat submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Form Permintaan Munaqasyah</CardTitle>
        <CardDescription>
          {settingData?.success && (
            <span className="text-sm text-muted-foreground">
              Tahun Ajaran: <b>{settingData.data.currentYear}</b> - Semester:{' '}
              <b>{settingData.data.currentSemester}</b>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Kelompok</Label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kelompok" />
              </SelectTrigger>
              <SelectContent>
                {filteredGroups.map((g) => (
                  <SelectItem key={g.groupId} value={g.groupId}>
                    {g.groupName} - {g.classroomName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Siswa</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Siswa" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Juz</Label>
            <Select
              value={selectedJuzId?.toString() || ''}
              onValueChange={(val) => setSelectedJuzId(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Juz" />
              </SelectTrigger>
              <SelectContent>
                {juzList.map((j) => (
                  <SelectItem key={j.id} value={String(j.id)}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Batch</Label>
            <Select
              value={selectedBatch}
              onValueChange={(value) => setSelectedBatch(value as MunaqasyahBatch)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MunaqasyahBatch.TAHAP_1}>Tahap 1</SelectItem>
                <SelectItem value={MunaqasyahBatch.TAHAP_2}>Tahap 2</SelectItem>
                <SelectItem value={MunaqasyahBatch.TAHAP_3}>Tahap 3</SelectItem>
                <SelectItem value={MunaqasyahBatch.TAHAP_4}>Tahap 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-center">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Mendaftarkan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Daftarkan Munaqasyah
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
