'use client';

import { useEffect, useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Semester, TashihType } from '@prisma/client';

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

interface SurahJuz {
  id: number;
  surahId: number;
  juzId: number;
  surah: { id: number; name: string };
}

interface Wafa {
  id: number;
  name: string;
}

interface ExamRequestPayload {
  studentId: string;
  tashihType: TashihType;
  notes: string;
  juzId?: number;
  surahId?: number;
  wafaId?: number;
  startPage?: number;
  endPage?: number;
}

export function TashihForm() {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [juzList, setJuzList] = useState<Juz[]>([]);
  const [surahJuzList, setSurahJuzList] = useState<SurahJuz[]>([]);
  const [wafaList, setWafaList] = useState<Wafa[]>([]);

  const [academicSemester, setAcademicSemester] = useState<string | 'all'>('all');
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [tashihType, setTashihType] = useState<TashihType>(TashihType.ALQURAN);
  const [selectedJuzId, setSelectedJuzId] = useState<number | null>(null);
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [selectedWafaId, setSelectedWafaId] = useState<number | null>(null);
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      const [groupRes, juzRes, surahJuzRes, wafaRes] = await Promise.all([
        fetch('/api/teacher/group'),
        fetch('/api/juz'),
        fetch('/api/surahJuz'),
        fetch('/api/wafa'),
      ]);

      const [groupJson, juzJson, surahJuzJson, wafaJson] = await Promise.all([
        groupRes.json(),
        juzRes.json(),
        surahJuzRes.json(),
        wafaRes.json(),
      ]);

      if (groupJson.success) setGroups(groupJson.data);
      if (juzJson.success) setJuzList(juzJson.data);
      if (surahJuzJson.success) setSurahJuzList(surahJuzJson.data);
      if (wafaJson.success) setWafaList(wafaJson.data);
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (academicSemester === 'all') {
      setFilteredGroups(groups);
    } else {
      const [year, semester] = academicSemester.split('|');
      setFilteredGroups(
        groups.filter((g) => g.classroomAcademicYear === year && g.classroomSemester === semester)
      );
    }
    setSelectedGroupId('');
    setStudents([]);
  }, [academicSemester, groups]);

  useEffect(() => {
    if (!selectedGroupId) return;

    const fetchStudents = async () => {
      const res = await fetch(`/api/teacher/group/${selectedGroupId}/member`);
      const json = await res.json();
      if (json.success) setStudents(json.data);
    };

    fetchStudents();
  }, [selectedGroupId]);

  const academicOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const g of groups) {
      unique.add(`${g.classroomAcademicYear}|${g.classroomSemester}`);
    }
    return Array.from(unique).map((s) => {
      const [year, semester] = s.split('|');
      return {
        value: s,
        label: `${year} ${semester}`,
      };
    });
  }, [groups]);

  const filteredSurah = useMemo(() => {
    return surahJuzList
      .filter((sj) => sj.juzId === selectedJuzId)
      .sort((a, b) => b.surah.id - a.surah.id);
  }, [surahJuzList, selectedJuzId]);

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      toast.error('Lengkapi semua data');
      return;
    }

    const payload: ExamRequestPayload = {
      studentId: selectedStudentId,
      tashihType,
      notes,
    };

    if (tashihType === TashihType.ALQURAN) {
      if (!selectedJuzId || !selectedSurahId) {
        toast.error('Pilih Juz dan Surah');
        return;
      }
      payload.juzId = selectedJuzId;
      payload.surahId = selectedSurahId;
    } else {
      if (!selectedWafaId || !startPage) {
        toast.error('Pilih Wafa dan halaman mulai');
        return;
      }
      payload.wafaId = selectedWafaId;
      payload.startPage = parseInt(startPage);
      payload.endPage = endPage ? parseInt(endPage) : parseInt(startPage);
    }

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/tashih/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Berhasil mendaftarkan ujian');
        setSelectedGroupId('');
        setSelectedStudentId('');
        setSelectedJuzId(null);
        setSelectedSurahId(null);
        setSelectedWafaId(null);
        setStartPage('');
        setEndPage('');
        setNotes('');
      } else {
        toast.error(json.message ?? 'Gagal mendaftar ujian');
      }
    } catch (error) {
      console.error('[EXAM_REQUEST_SUBMIT]', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Tahun Ajaran & Semester</Label>
        <Select value={academicSemester} onValueChange={setAcademicSemester}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih Tahun & Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {academicOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Kelompok</Label>
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih Kelompok" />
          </SelectTrigger>
          <SelectContent>
            {filteredGroups.map((g) => (
              <SelectItem key={g.groupId} value={g.groupId}>
                {g.groupName} - {g.classroomName} ({g.classroomAcademicYear} {g.classroomSemester})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      {/* Jenis Tashih */}
      <div>
        <Label>Jenis Tashih</Label>
        <Select value={tashihType} onValueChange={(v) => setTashihType(v as TashihType)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih Jenis Tashih" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TashihType.ALQURAN}>AL-QUR&apos;AN</SelectItem>
            <SelectItem value={TashihType.WAFA}>WAFA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Input Berdasarkan Jenis Tashih */}
      {tashihType === TashihType.ALQURAN && (
        <>
          <div>
            <Label>Juz</Label>
            <Select
              value={selectedJuzId?.toString() || ''}
              onValueChange={(val) => {
                setSelectedJuzId(Number(val));
                setSelectedSurahId(null);
              }}
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
            <Label>Surah</Label>
            <Select
              value={selectedSurahId?.toString() || ''}
              onValueChange={(val) => setSelectedSurahId(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Surah dalam Juz" />
              </SelectTrigger>
              <SelectContent>
                {filteredSurah.map((sj) => (
                  <SelectItem key={sj.surah.id} value={String(sj.surah.id)}>
                    {sj.surah.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {tashihType === TashihType.WAFA && (
        <>
          <div>
            <Label>Wafa</Label>
            <Select
              value={selectedWafaId?.toString() || ''}
              onValueChange={(val) => setSelectedWafaId(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Wafa" />
              </SelectTrigger>
              <SelectContent>
                {wafaList.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Halaman Mulai</Label>
              <Input
                type="number"
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
              />
            </div>
            <div>
              <Label>Halaman Selesai</Label>
              <Input type="number" value={endPage} onChange={(e) => setEndPage(e.target.value)} />
            </div>
          </div>
        </>
      )}

      <div>
        <Label>Catatan</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Mendaftar ujian...
          </>
        ) : (
          <>
            <Save className="mr-2" />
            Daftarkan Ujian
          </>
        )}
      </Button>
    </div>
  );
}
