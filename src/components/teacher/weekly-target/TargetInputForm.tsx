'use client';

import { useEffect, useState, useMemo } from 'react';
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
  SelectValue,
  SelectItem,
  SelectContent,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { SubmissionType } from '@prisma/client';
import { DateRange } from 'react-day-picker';
import { Calendar23 } from '@/components/calendar/calendar-23';

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

interface Group {
  groupId: string;
  groupName: string;
  classroomName: string;
  classroomAcademicYear: string;
  classroomSemester: string;
  totalMember: number;
}

interface Student {
  id: string;
  nis: string;
  fullName: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TargetInputForm() {
  // Form state
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [type, setType] = useState<SubmissionType>('TAHFIDZ');
  const [description, setDescription] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>();
  const [isForAllStudents, setIsForAllStudents] = useState(false);

  // Data state
  const [groupList, setGroupList] = useState<Group[]>([]);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [juzList, setJuzList] = useState<{ id: number; name: string }[]>([]);
  const [startJuzId, setStartJuzId] = useState('');
  const [endJuzId, setEndJuzId] = useState('');
  const [surahJuzList, setSurahJuzList] = useState<SurahJuz[]>([]);
  const [wafaList, setWafaList] = useState<Wafa[]>([]);

  // Target specific state
  const [surahStartId, setSurahStartId] = useState('');
  const [surahEndId, setSurahEndId] = useState('');
  const [startAyat, setStartAyat] = useState('');
  const [endAyat, setEndAyat] = useState('');
  const [wafaId, setWafaId] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [loading, setLoading] = useState(false);

  // SWR hooks
  const { data: academicSetting } = useSWR('/api/academicSetting', fetcher);

  // Filter groups for current academic year and semester
  const filteredGroupList = useMemo(() => {
    if (!academicSetting?.success || !academicSetting?.data || groupList.length === 0) return [];

    const { currentYear, currentSemester } = academicSetting.data;
    return groupList.filter((group) => {
      return (
        group.classroomAcademicYear === currentYear && group.classroomSemester === currentSemester
      );
    });
  }, [groupList, academicSetting]);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      const [juzRes, surahJuzRes, wafaRes] = await Promise.all([
        fetch('/api/juz'),
        fetch('/api/surahJuz'),
        fetch('/api/wafa'),
      ]);
      const [juzData, surahJuzData, wafaData] = await Promise.all([
        juzRes.json(),
        surahJuzRes.json(),
        wafaRes.json(),
      ]);

      if (juzData.success) setJuzList(juzData.data);
      if (surahJuzData.success) setSurahJuzList(surahJuzData.data);
      if (wafaData.success) setWafaList(wafaData.data);
    };
    fetchData();
  }, []);

  // Load teacher groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/teacher/group');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setGroupList(json.data);
        } else {
          console.error('Groups data is not an array:', json);
          setGroupList([]);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast.error('Gagal memuat data kelompok');
        setGroupList([]);
      }
    };
    fetchGroups();
  }, []);

  // Load students when group is selected
  useEffect(() => {
    if (!selectedGroupId) {
      setStudentList([]);
      setSelectedStudentId('');
      return;
    }

    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/teacher/group/${selectedGroupId}/member`);
        const resData = await res.json();
        if (resData.success && Array.isArray(resData.data)) {
          setStudentList(resData.data);
        } else {
          console.error('Students data is not an array:', resData);
          setStudentList([]);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Gagal mengambil siswa');
        setStudentList([]);
      }
    };
    fetchMembers();
  }, [selectedGroupId]);

  const filteredSurahStart = surahJuzList
    .filter((s) => s.juzId.toString() === startJuzId)
    .sort((a, b) => a.surah.id - b.surah.id);

  const filteredSurahEnd = surahJuzList
    .filter((s) => s.juzId.toString() === endJuzId)
    .sort((a, b) => a.surah.id - b.surah.id);

  const resetForm = () => {
    setType('TAHFIDZ');
    setDescription('');
    setDateRange(undefined);
    setStartJuzId('');
    setEndJuzId('');
    setSurahStartId('');
    setSurahEndId('');
    setStartAyat('');
    setEndAyat('');
    setWafaId('');
    setStartPage('');
    setEndPage('');
    setSelectedStudentId('');
    setIsForAllStudents(false);
    setSelectedGroupId(''); // Reset group selection too
  };

  const handleSubmit = async () => {
    if (!academicSetting?.data) return;
    if (!selectedGroupId) {
      toast.error('Silakan pilih kelompok');
      return;
    }
    if (!isForAllStudents && !selectedStudentId) {
      toast.error('Silakan pilih siswa atau centang "Untuk semua siswa"');
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Silakan pilih tanggal awal dan akhir target');
      return;
    }

    const targetStudents = isForAllStudents
      ? studentList
      : studentList.filter((s: Student) => s.id === selectedStudentId);

    if (targetStudents.length === 0) {
      toast.error('Tidak ada siswa yang dipilih');
      return;
    }

    const basePayload = {
      academicYear: academicSetting.data.currentYear,
      semester: academicSetting.data.currentSemester,
      type,
      description,
      startDate: dateRange.from,
      endDate: dateRange.to,
      surahStartId: type !== SubmissionType.TAHSIN_WAFA ? parseInt(surahStartId) || null : null,
      surahEndId: type !== SubmissionType.TAHSIN_WAFA ? parseInt(surahEndId) || null : null,
      startAyat: type !== SubmissionType.TAHSIN_WAFA ? parseInt(startAyat) || null : null,
      endAyat: type !== SubmissionType.TAHSIN_WAFA ? parseInt(endAyat) || null : null,
      wafaId: type === SubmissionType.TAHSIN_WAFA ? parseInt(wafaId) || null : null,
      startPage: type === SubmissionType.TAHSIN_WAFA ? parseInt(startPage) || null : null,
      endPage: type === SubmissionType.TAHSIN_WAFA ? parseInt(endPage) || null : null,
    };

    setLoading(true);
    try {
      const promises = targetStudents.map((student: Student) =>
        fetch('/api/teacher/weekly-target', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...basePayload,
            studentId: student.id,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map((res: Response) => res.json()));

      const failedResults = results.filter((result: { success: boolean }) => !result.success);

      if (failedResults.length > 0) {
        throw new Error(`${failedResults.length} target gagal disimpan`);
      }

      toast.success(`Target berhasil disimpan untuk ${targetStudents.length} siswa`);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan target');
    } finally {
      setLoading(false);
    }
  };

  //   const selectedGroup = filteredGroupList.find((g: Group) => g.groupId === selectedGroupId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Target Setoran</CardTitle>
        <CardDescription>
          {academicSetting?.data && (
            <span className="text-sm text-muted-foreground">
              Tahun Ajaran: <strong>{academicSetting.data.currentYear}</strong> - Semester:{' '}
              <strong>{academicSetting.data.currentSemester}</strong>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pilih Kelompok dan Siswa */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <Label className="mb-2 block">Kelompok</Label>
            <Select
              value={selectedGroupId}
              onValueChange={(value) => {
                setSelectedGroupId(value);
                setSelectedStudentId(''); // Reset student selection
                setIsForAllStudents(false); // Reset all students selection
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelompok" />
              </SelectTrigger>
              <SelectContent>
                {filteredGroupList.map((group: Group) => (
                  <SelectItem key={group.groupId} value={group.groupId}>
                    {group.groupName} - {group.classroomName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <Label>Siswa</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allStudents"
                  checked={isForAllStudents}
                  onChange={(e) => {
                    setIsForAllStudents(e.target.checked);
                    if (e.target.checked) {
                      setSelectedStudentId('');
                    }
                  }}
                  disabled={!selectedGroupId}
                />
                <Label htmlFor="allStudents" className="text-sm">
                  Untuk semua siswa
                </Label>
              </div>
            </div>

            {!isForAllStudents ? (
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
                disabled={!selectedGroupId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih siswa" />
                </SelectTrigger>
                <SelectContent>
                  {studentList.map((student: Student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.fullName} ({student.nis})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-muted rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Target akan dibuat untuk semua {studentList.length} siswa dalam kelompok ini
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Calendar23 value={dateRange} onChange={setDateRange} />

        {/* Jenis Setoran */}
        <div>
          <Label className="mb-2 block">Jenis Setoran</Label>
          <Select value={type} onValueChange={(v) => setType(v as SubmissionType)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SubmissionType.TAHFIDZ}>Tahfidz</SelectItem>
              <SelectItem value={SubmissionType.TAHSIN_WAFA}>Tahsin (Wafa)</SelectItem>
              <SelectItem value={SubmissionType.TAHSIN_ALQURAN}>Tahsin (Al-Quran)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bagian Juz dan Surah */}
        {(type === SubmissionType.TAHFIDZ || type === SubmissionType.TAHSIN_ALQURAN) && (
          <div className="flex flex-col space-y-4">
            {/* Juz Awal dan Juz Akhir */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Juz Awal */}
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Juz Awal</Label>
                <Select value={startJuzId} onValueChange={setStartJuzId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Juz Awal" />
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
              {/* Juz Akhir */}
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Juz Akhir</Label>
                <Select value={endJuzId} onValueChange={setEndJuzId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Juz Akhir" />
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
            </div>
            {/* Surah Awal dan Surah Akhir */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Surah Awal */}
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Surah Awal</Label>
                <Select value={surahStartId} onValueChange={setSurahStartId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Surah Awal" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSurahStart.map((s) => (
                      <SelectItem key={s.surah.id} value={s.surah.id.toString()}>
                        {s.surah.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Surah Akhir */}
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Surah Akhir</Label>
                <Select value={surahEndId} onValueChange={setSurahEndId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Surah Akhir" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSurahEnd.map((s) => (
                      <SelectItem key={s.surah.id} value={s.surah.id.toString()}>
                        {s.surah.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Ayat */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Ayat Awal</Label>
                <Input
                  type="number"
                  value={startAyat}
                  onChange={(e) => setStartAyat(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Ayat Akhir</Label>
                <Input
                  type="number"
                  value={endAyat}
                  onChange={(e) => setEndAyat(e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Wafa dan Halaman */}
        {type === SubmissionType.TAHSIN_WAFA && (
          <div className="flex flex-col space-y-4">
            {/* Materi Wafa */}
            <div className="flex-1 min-w-0">
              <Label className="mb-2 block">Materi Wafa</Label>
              <Select value={wafaId} onValueChange={setWafaId}>
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
            {/* Halaman Mulai dan Selesai */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Halaman Mulai */}
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Halaman Mulai</Label>
                <Input
                  type="number"
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  placeholder="1"
                />
              </div>
              {/* Halaman Selesai */}
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Halaman Selesai</Label>
                <Input
                  type="number"
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Deskripsi */}
        <div>
          <Label className="mb-2 block">Deskripsi</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tambahkan deskripsi atau catatan untuk target ini..."
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={loading || !selectedGroupId || (!isForAllStudents && !selectedStudentId)}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Target
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
