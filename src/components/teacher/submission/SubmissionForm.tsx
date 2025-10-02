'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Calendar01 } from '@/components/calendar/calendar-01';
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
  surahId: number;
  juzId: number;
  startVerse: number;
  endVerse: number;
  surah: {
    id: number;
    name: string;
  };
  juz: {
    id: number;
    name: string;
  };
}

interface Juz {
  id: number;
  name: string;
}

interface Wafa {
  id: number;
  name: string;
}

interface FormData {
  date: Date;
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
  const [juzList, setJuzList] = useState<Juz[]>([]);
  const [surahJuzList, setSurahJuzList] = useState<SurahJuz[]>([]);
  const [wafaList, setWafaList] = useState<Wafa[]>([]);

  const [groupId, setGroupId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [submissionDate, setSubmissionDate] = useState<Date>();
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

  const { data: academic } = useSWR('/api/academicSetting', fetcher);

  const filteredGroupList = useMemo(() => {
    if (!academic?.success || !academic?.data || groupList.length === 0) return [];

    const { currentYear, currentSemester } = academic.data;
    return groupList.filter((group) => {
      return (
        group.classroomAcademicYear === currentYear && group.classroomSemester === currentSemester
      );
    });
  }, [groupList, academic]);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [surahJuzRes, juzRes, wafaRes] = await Promise.all([
          fetch('/api/surahJuz'),
          fetch('/api/juz'),
          fetch('/api/wafa'),
        ]);

        const [surahJuzData, juzData, wafaData] = await Promise.all([
          surahJuzRes.json(),
          juzRes.json(),
          wafaRes.json(),
        ]);

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
    if (!groupId) {
      setStudentList([]);
      return;
    }

    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/teacher/group/${groupId}/member`);
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
  }, [groupId]);

  const resetForm = () => {
    setSubmissionDate(new Date());
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

  const handleSubmit = async () => {
    if (!groupId || !studentId || !submissionType) {
      toast.error('Lengkapi semua field terlebih dahulu');
      return;
    }

    const formData: FormData = {
      date: submissionDate || new Date(),
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
      toast.success('Setoran berhasil ditambahkan');
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Gagal menambahkan setoran');
    } finally {
      setLoading(false);
    }
  };

  const filteredSurahJuz = surahJuzList
    .filter((s) => s.juz.id.toString() === selectedJuz)
    .sort((a, b) => a.surah.id - b.surah.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Setoran</CardTitle>
        <CardDescription>
          {academic?.success && (
            <span className="text-sm text-muted-foreground">
              Tahun Ajaran: <b>{academic.data.currentYear}</b> - Semester:{' '}
              <b>{academic.data.currentSemester}</b>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <Label className="mb-2 block">Kelompok</Label>
            <Select
              value={groupId}
              onValueChange={(value) => {
                setGroupId(value);
                setStudentId(''); // Reset student selection
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kelompok" />
              </SelectTrigger>
              <SelectContent>
                {filteredGroupList.map((group) => (
                  <SelectItem key={group.groupId} value={group.groupId}>
                    {group.groupName} - {group.classroomName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-0">
            <Label className="mb-2 block">Siswa</Label>
            <Select value={studentId} onValueChange={setStudentId} disabled={!groupId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Siswa" />
              </SelectTrigger>
              <SelectContent>
                {studentList.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.fullName} ({student.nis})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Calendar01 value={submissionDate} onChange={setSubmissionDate} label="Tanggal Setoran" />

        {/* Jenis Setoran */}
        <div>
          <Label className="mb-2 block">Jenis Setoran</Label>
          <Select
            value={submissionType}
            onValueChange={(val) => {
              setSubmissionType(val as SubmissionType);
              // Reset selections when type changes
              setSelectedJuz('');
              setSelectedSurahId('');
              setStartVerse('');
              setEndVerse('');
              setSelectedWafaId('');
              setStartPage('');
              setEndPage('');
            }}
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
                <Select
                  value={selectedJuz}
                  onValueChange={(val) => {
                    setSelectedJuz(val);
                    setSelectedSurahId(''); // Reset surah when juz changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Juz" />
                  </SelectTrigger>
                  <SelectContent>
                    {juzList.map((juz) => (
                      <SelectItem key={juz.id} value={juz.id.toString()}>
                        {juz.name}
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
                    {filteredSurahJuz.map((sj) => (
                      <SelectItem key={sj.surah.id} value={sj.surah.id.toString()}>
                        {sj.surah.name}
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
                  min="1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Ayat Selesai</Label>
                <Input
                  type="number"
                  value={endVerse}
                  onChange={(e) => setEndVerse(e.target.value)}
                  placeholder="7"
                  min={startVerse || '1'}
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
                  {wafaList.map((wafa) => (
                    <SelectItem key={wafa.id} value={wafa.id.toString()}>
                      {wafa.name}
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
                  min="1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="mb-2 block">Halaman Selesai</Label>
                <Input
                  type="number"
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                  placeholder="10"
                  min={startPage || '1'}
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
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={handleSubmit} disabled={loading}>
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
      </CardFooter>
    </Card>
  );
}
