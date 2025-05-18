'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { Semester, SubmissionType, SubmissionStatus, Adab } from '@prisma/client';

interface Group {
  groupId: string;
  groupName: string;
  classroomName: string;
  classroomAcademicYear: string;
  classroomSemester: Semester;
  totalMember: number;
}

interface Student {
  id: string;
  nis: string;
  fullName: string;
}

interface SurahJuz {
  id: number;
  juzId: number;
  startVerse: number;
  endVerse: number;
  surah: {
    id: number;
    name: string;
    verseCount: number;
  };
  juz: {
    id: number;
    name: string;
  };
}

interface Wafa {
  id: number;
  name: string;
}

interface FormData {
  groupId: string;
  studentId: string;
  submissionType: SubmissionType;
  submissionStatus: SubmissionStatus;
  adab: Adab;
  note: string;
  juzId?: number;
  surahId?: number;
  startVerse?: number;
  endVerse?: number;
  wafaId?: number;
  startPage?: number;
  endPage?: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SubmissionForm() {
  const [groupList, setGroupList] = useState<Group[]>([]);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [surahJuzList, setSurahJuzList] = useState<SurahJuz[]>([]);
  const [juzList, setJuzList] = useState<{ id: number; name: string }[]>([]);
  const [wafaList, setWafaList] = useState<Wafa[]>([]);

  const [groupId, setGroupId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [submissionType, setSubmissionType] = useState<SubmissionType>(SubmissionType.TAHFIDZ);
  const [selectedJuz, setSelectedJuz] = useState('');
  const [selectedSurahId, setSelectedSurahId] = useState('');
  const [startVerse, setStartVerse] = useState('');
  const [endVerse, setEndVerse] = useState('');
  const [selectedWafaId, setSelectedWafaId] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>(
    SubmissionStatus.LULUS
  );
  const [adab, setAdab] = useState<Adab>(Adab.BAIK);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: academicSetting } = useSWR('/api/academicSetting', fetcher);

  const filteredGroupList = useMemo(() => {
    if (!academicSetting?.data) return [];
    const { currentYear, currentSemester } = academicSetting.data;
    return groupList.filter(
      (g) => g.classroomAcademicYear === currentYear && g.classroomSemester === currentSemester
    );
  }, [groupList, academicSetting]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, surahJuzRes, juzRes, wafaRes] = await Promise.all([
          fetch('/api/teacher/group'),
          fetch('/api/surahJuz'),
          fetch('/api/juz'),
          fetch('/api/wafa'),
        ]);

        const [groupData, surahJuzData, juzData, wafaData] = await Promise.all([
          groupRes.json(),
          surahJuzRes.json(),
          juzRes.json(),
          wafaRes.json(),
        ]);

        if (groupData.success) setGroupList(groupData.data);
        if (surahJuzData.success) setSurahJuzList(surahJuzData.data);
        if (juzData.success) setJuzList(juzData.data);
        if (wafaData.success) setWafaList(wafaData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Gagal mengambil data');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!groupId) return;
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/teacher/group/${groupId}/member`);
        const resData = await res.json();
        if (resData.success) setStudentList(resData.data);
      } catch {
        toast.error('Gagal mengambil siswa');
      }
    };
    fetchMembers();
  }, [groupId]);

  const handleSubmit = async () => {
    if (!groupId || !studentId || !submissionType) {
      toast.error('Lengkapi semua field terlebih dahulu');
      return;
    }

    const formData: FormData = {
      groupId,
      studentId,
      submissionType,
      submissionStatus,
      adab,
      note,
      ...(submissionType === SubmissionType.TAHFIDZ ||
      submissionType === SubmissionType.TAHSIN_ALQURAN
        ? {
            juzId: selectedJuz ? parseInt(selectedJuz) : undefined,
            surahId: selectedSurahId ? parseInt(selectedSurahId) : undefined,
            startVerse: startVerse ? parseInt(startVerse) : undefined,
            endVerse: endVerse ? parseInt(endVerse) : undefined,
          }
        : {
            wafaId: selectedWafaId ? parseInt(selectedWafaId) : undefined,
            startPage: startPage ? parseInt(startPage) : undefined,
            endPage: endPage ? parseInt(endPage) : undefined,
          }),
    };

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const resData = await res.json();

      if (!resData.success) throw new Error(resData.message);
      toast.success('Setoran berhasil ditambahkan!');
      resetForm();
    } catch {
      toast.error('Gagal submit setoran');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStudentId('');
    setSelectedJuz('');
    setSelectedSurahId('');
    setStartVerse('');
    setEndVerse('');
    setSelectedWafaId('');
    setStartPage('');
    setEndPage('');
    setNote('');
  };

  const filteredSurahJuz = surahJuzList
    .filter((s) => s.juz.id.toString() === selectedJuz)
    .sort((a, b) => b.surah.id - a.surah.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Input Setoran</CardTitle>
        <CardDescription>
          {academicSetting?.success && (
            <div className="mb-4 text-sm text-muted-foreground">
              Tahun Ajaran: <span className="font-medium">{academicSetting.data.currentYear}</span>{' '}
              — Semester:{' '}
              <span className="font-medium">{academicSetting.data.currentSemester}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Kelompok dan Siswa */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <Label className="mb-2 block">Kelompok</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kelompok" />
              </SelectTrigger>
              <SelectContent>
                {filteredGroupList.map((k) => (
                  <SelectItem key={k.groupId} value={k.groupId}>
                    {k.groupName} - {k.classroomName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-0">
            <Label className="mb-2 block">Siswa</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Siswa" />
              </SelectTrigger>
              <SelectContent>
                {studentList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Jenis Setoran */}
        <div>
          <Label className="mb-2 block">Jenis Setoran</Label>
          <Select
            value={submissionType}
            onValueChange={(val) => setSubmissionType(val as SubmissionType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Jenis Setoran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SubmissionType.TAHFIDZ}>TAHFIDZ</SelectItem>
              <SelectItem value={SubmissionType.TAHSIN_WAFA}>TAHSIN WAFA</SelectItem>
              <SelectItem value={SubmissionType.TAHSIN_ALQURAN}>TAHSIN AL-QURAN</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Detail Setoran */}
        {submissionType === SubmissionType.TAHFIDZ ||
        submissionType === SubmissionType.TAHSIN_ALQURAN ? (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Juz</Label>
                <Select value={selectedJuz} onValueChange={setSelectedJuz}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Juz" />
                  </SelectTrigger>
                  <SelectContent>
                    {juzList.map((j) => (
                      <SelectItem key={j.id} value={j.id.toString()}>
                        {j.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Surah</Label>
                <Select
                  value={selectedSurahId}
                  onValueChange={setSelectedSurahId}
                  disabled={!selectedJuz}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Surah" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSurahJuz.map((s) => (
                      <SelectItem key={s.surah.id} value={s.surah.id.toString()}>
                        {s.surah.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Ayat Mulai</Label>
                <Input
                  type="number"
                  value={startVerse}
                  onChange={(e) => setStartVerse(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Ayat Selesai</Label>
                <Input
                  type="number"
                  value={endVerse}
                  onChange={(e) => setEndVerse(e.target.value)}
                  placeholder="7"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex-1 min-w-0">
              <Label className="mb-2 block">Wafa</Label>
              <Select value={selectedWafaId} onValueChange={setSelectedWafaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Wafa" />
                </SelectTrigger>
                <SelectContent>
                  {wafaList.map((w) => (
                    <SelectItem key={w.id} value={w.id.toString()}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Halaman Mulai</Label>
                <Input
                  type="number"
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Halaman Selesai</Label>
                <Input
                  type="number"
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        )}

        {/* Status & Adab */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <Label className="mb-2 block">Status Setoran</Label>
            <Select
              value={submissionStatus}
              onValueChange={(val) => setSubmissionStatus(val as SubmissionStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SubmissionStatus.LULUS}>LULUS</SelectItem>
                <SelectItem value={SubmissionStatus.TIDAK_LULUS}>TIDAK LULUS</SelectItem>
                <SelectItem value={SubmissionStatus.MENGULANG}>MENGULANG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-0">
            <Label className="mb-2 block">Adab</Label>
            <Select value={adab} onValueChange={(val) => setAdab(val as Adab)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Adab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Adab.BAIK}>BAIK</SelectItem>
                <SelectItem value={Adab.KURANG_BAIK}>KURANG BAIK</SelectItem>
                <SelectItem value={Adab.TIDAK_BAIK}>TIDAK BAIK</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Catatan */}
        <div>
          <Label className="mb-2 block">Catatan</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Masukkan catatan"
            className="min-h-24"
          />
        </div>

        {/* Submit Button */}
        <Button onClick={handleSubmit} disabled={loading} className="w-full mt-6">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Menyimpan setoran...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Setoran
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
