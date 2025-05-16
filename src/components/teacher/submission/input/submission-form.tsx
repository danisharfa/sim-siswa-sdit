'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  juz?: number;
  surahId?: number;
  startVerse?: number;
  endVerse?: number;
  wafaId?: number;
  startPage?: number;
  endPage?: number;
}

export function SubmissionForm() {
  const [groupList, setGroupList] = useState<Group[]>([]);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [surahJuzList, setSurahJuzList] = useState<SurahJuz[]>([]);
  const [juzList, setJuzList] = useState<{ id: number; name: string }[]>([]);
  const [wafaList, setWafaList] = useState<Wafa[]>([]);
  const [academicSemester, setAcademicSemester] = useState<string | 'all'>('all');
  const [filteredGroupList, setFilteredGroupList] = useState<Group[]>([]);

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

  const academicOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const g of groupList) {
      unique.add(`${g.classroomAcademicYear}|${g.classroomSemester}`);
    }
    return Array.from(unique).map((s) => {
      const [year, semester] = s.split('|');
      return {
        value: s,
        label: `${year} ${semester}`,
      };
    });
  }, [groupList]);

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
        console.error('Gagal mengambil data:', error);
        toast.error('Gagal mengambil data');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (academicSemester === 'all') {
      setFilteredGroupList(groupList);
    } else {
      const [year, semester] = academicSemester.split('|');
      setFilteredGroupList(
        groupList.filter(
          (g) => g.classroomAcademicYear === year && g.classroomSemester === semester
        )
      );
    }
    setGroupId('');
    setStudentList([]);
  }, [academicSemester, groupList]);

  useEffect(() => {
    if (!groupId) return;
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/teacher/group/${groupId}/member`);
        const resData = await res.json();
        if (resData.success) setStudentList(resData.data);
      } catch (error) {
        console.error('Gagal mengambil siswa:', error);
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

      if (!resData.success) {
        throw new Error(resData.message);
      }

      toast.success('Setoran berhasil ditambahkan!');
      resetForm();
    } catch (error) {
      console.error('Gagal submit:', error);
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
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tahun Ajaran & Semester */}
          <div>
            <Label>Tahun Ajaran</Label>
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
          {/* Pilih Kelompok */}
          <div>
            <Label>Kelompok</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kelompok" />
              </SelectTrigger>
              <SelectContent>
                {filteredGroupList.map((k) => (
                  <SelectItem key={k.groupId} value={k.groupId}>
                    {k.groupName} - {k.classroomName} ({k.classroomAcademicYear}{' '}
                    {k.classroomSemester})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pilih Siswa */}
          <div>
            <Label>Siswa</Label>
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
          <Label>Jenis Setoran</Label>
          <Select
            value={submissionType}
            onValueChange={(val) => setSubmissionType(val as typeof submissionType)}
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

        {/* Tampilkan opsi berdasarkan Jenis Setoran */}
        {submissionType === SubmissionType.TAHFIDZ ||
        submissionType === SubmissionType.TAHSIN_ALQURAN ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div>
              <Label>Juz</Label>
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
            <div>
              <Label>Surah</Label>
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

            <div>
              <Label>Ayat Mulai</Label>
              <Input
                type="number"
                value={startVerse}
                onChange={(e) => setStartVerse(e.target.value)}
                min={1}
              />
            </div>

            <div>
              <Label>Ayat Selesai</Label>
              <Input
                type="number"
                value={endVerse}
                onChange={(e) => setEndVerse(e.target.value)}
                min={1}
              />
            </div>
          </div>
        ) : (
          submissionType === SubmissionType.TAHSIN_WAFA && (
            <div className="flex flex-col lg:flex-row gap-6">
              <div>
                <Label>Wafa</Label>
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

              <div>
                <Label>Halaman Mulai</Label>
                <Input
                  type="number"
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  min={1}
                />
              </div>

              <div>
                <Label>Halaman Selesai</Label>
                <Input
                  type="number"
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                  min={1}
                />
              </div>
            </div>
          )
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Status Setoran */}
          <div>
            <Label>Status Setoran</Label>
            <Select
              value={submissionStatus}
              onValueChange={(val) => setSubmissionStatus(val as typeof submissionStatus)}
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

          {/* Adab */}
          <div>
            <Label>Adab</Label>
            <Select value={adab} onValueChange={(val) => setAdab(val as typeof adab)}>
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
          <Label>Catatan</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Masukkan catatan"
          />
        </div>

        {/* Submit Button */}
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Menyimpan setoran...
            </>
          ) : (
            <>
              <Save />
              Simpan Setoran
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
