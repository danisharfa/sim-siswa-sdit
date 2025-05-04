'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface Group {
  groupId: string;
  groupName: string;
  classroomName: string;
  classroomAcademicYear: string;
}

interface Student {
  id: string;
  fullName: string;
}

interface Surah {
  id: number;
  name: string;
}

interface Juz {
  id: number;
  name: string;
}

export function ExamRequestForm() {
  const [loading, setLoading] = useState(false);

  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [juzList, setJuzList] = useState<Juz[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [examType, setExamType] = useState<'SURAH' | 'JUZ' | ''>('');
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      const [groupRes, surahRes, juzRes] = await Promise.all([
        fetch('/api/teacher/group'),
        fetch('/api/surah'),
        fetch('/api/juz'),
      ]);
      const groupJson = await groupRes.json();
      const surahJson = await surahRes.json();
      const juzJson = await juzRes.json();

      if (groupJson.success) setGroups(groupJson.data);
      if (surahJson.success) setSurahList(surahJson.data);
      if (juzJson.success) setJuzList(juzJson.data);
    };

    fetchInitialData();
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
    if (!selectedStudentId || !examType) {
      toast.error('Lengkapi semua field');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/exam/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          examType,
          surahId: examType === 'SURAH' ? selectedSurahId : null,
          juzId: examType === 'JUZ' ? selectedJuz : null,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Pendaftaran ujian berhasil');
        setSelectedGroupId('');
        setSelectedStudentId('');
        setExamType('');
        setSelectedSurahId(null);
        setSelectedJuz(null);
        setNotes('');
      } else {
        toast.error(json.message ?? 'Gagal mendaftar ujian');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('Terjadi kesalahan saat mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Kelompok */}
      <div>
        <Label>Kelompok</Label>
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih Kelompok" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.groupId} value={g.groupId}>
                {g.groupName} - {g.classroomName} ({g.classroomAcademicYear})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Siswa */}
      <div>
        <Label>Siswa</Label>
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

      {/* Jenis Ujian */}
      <div>
        <Label>Jenis Ujian</Label>
        <Select value={examType} onValueChange={(val) => setExamType(val as 'SURAH' | 'JUZ')}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih Jenis Ujian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SURAH">Surah</SelectItem>
            <SelectItem value="JUZ">Juz</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {examType === 'SURAH' && (
        <div key="surah">
          <Label>Surah</Label>
          <Select
            value={selectedSurahId?.toString() || ''}
            onValueChange={(val) => setSelectedSurahId(Number(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Surah" />
            </SelectTrigger>
            <SelectContent>
              {surahList.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {examType === 'JUZ' && (
        <div key="juz">
          <Label>Juz</Label>
          <Select
            value={selectedJuz?.toString() || ''}
            onValueChange={(val) => setSelectedJuz(Number(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Juz" />
            </SelectTrigger>
            <SelectContent>
              {juzList.map((juz) => (
                <SelectItem key={juz.id} value={String(juz.id)}>
                  {juz.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Catatan */}
      <div>
        <Label>Catatan</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tulis catatan (opsional)"
        />
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Mendaftar ujian...
          </>
        ) : (
          <>
            <Save />
            Daftarkan Ujian
          </>
        )}
      </Button>
    </div>
  );
}
