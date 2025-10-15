'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { Calendar01 } from '@/components/calendar/calendar-01';
import { Semester, SubmissionType, SubmissionStatus, Adab } from '@prisma/client';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';

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
  surah: { id: number; name: string };
  juz: { id: number; name: string };
}

interface Juz {
  id: number;
  name: string;
}

interface Wafa {
  id: number;
  name: string;
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
    return groupList.filter(
      (g) => g.classroomAcademicYear === currentYear && g.classroomSemester === currentSemester
    );
  }, [groupList, academic]);

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
      } catch {
        toast.error('Gagal mengambil data');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch('/api/teacher/group');
        const json = await res.json();
        setGroupList(json.success && Array.isArray(json.data) ? json.data : []);
      } catch {
        toast.error('Gagal memuat data kelompok');
        setGroupList([]);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    if (!groupId) {
      setStudentList([]);
      return;
    }
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/teacher/group/${groupId}/member`);
        const json = await res.json();
        setStudentList(json.success && Array.isArray(json.data) ? json.data : []);
      } catch {
        toast.error('Gagal mengambil siswa');
        setStudentList([]);
      }
    };
    fetchMembers();
  }, [groupId]);

  const filteredSurahJuz = surahJuzList
    .filter((s) => s.juz.id.toString() === selectedJuz)
    .sort((a, b) => a.surah.id - b.surah.id);

  const handleSubmit = async () => {
    if (!groupId || !studentId || !submissionType)
      return toast.error('Lengkapi semua data terlebih dahulu');

    const payload = {
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
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success('Setoran berhasil disimpan');
      resetForm();
    } catch {
      toast.error('Gagal menyimpan setoran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Setoran</CardTitle>
        <CardDescription>
          {academic?.success && (
            <span className="text-sm text-muted-foreground">
              Tahun Ajaran: <b>{academic.data.currentYear}</b> — Semester:{' '}
              <b>{academic.data.currentSemester}</b>
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <FieldSet>
          <FieldGroup className="flex flex-col md:flex-row gap-4">
            <Field className="flex-1 min-w-0">
              <FieldLabel>Kelompok</FieldLabel>
              <Select
                value={groupId}
                onValueChange={(val) => {
                  setGroupId(val);
                  setStudentId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kelompok" />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroupList.map((group) => (
                    <SelectItem key={group.groupId} value={group.groupId}>
                      {group.groupName} — {group.classroomName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="flex-1 min-w-0">
              <FieldLabel>Siswa</FieldLabel>
              <Select value={studentId} onValueChange={setStudentId} disabled={!groupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Siswa" />
                </SelectTrigger>
                <SelectContent>
                  {studentList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName} ({s.nis})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <Field>
            <Calendar01
              value={submissionDate}
              onChange={setSubmissionDate}
              label="Tanggal Setoran"
            />
          </Field>

          <Field>
            <FieldLabel>Jenis Setoran</FieldLabel>
            <Select
              value={submissionType}
              onValueChange={(val) => {
                setSubmissionType(val as SubmissionType);
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
                <SelectItem value={SubmissionType.TAHFIDZ}>Tahfidz</SelectItem>
                <SelectItem value={SubmissionType.TAHSIN_WAFA}>Tahsin (Wafa)</SelectItem>
                <SelectItem value={SubmissionType.TAHSIN_ALQURAN}>Tahsin (Al-Qur’an)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {(submissionType === SubmissionType.TAHFIDZ ||
            submissionType === SubmissionType.TAHSIN_ALQURAN) && (
            <>
              <FieldGroup className="flex flex-col md:flex-row gap-4">
                <Field className="flex-1 min-w-0">
                  <FieldLabel>Juz</FieldLabel>
                  <Select
                    value={selectedJuz}
                    onValueChange={(val) => {
                      setSelectedJuz(val);
                      setSelectedSurahId('');
                    }}
                  >
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
                </Field>

                <Field className="flex-1 min-w-0">
                  <FieldLabel>Surah</FieldLabel>
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
                </Field>
              </FieldGroup>

              <FieldGroup className="flex flex-col md:flex-row gap-4">
                <Field className="flex-1 min-w-0">
                  <FieldLabel>Ayat Mulai</FieldLabel>
                  <Input
                    type="number"
                    value={startVerse}
                    onChange={(e) => setStartVerse(e.target.value)}
                    placeholder="1"
                  />
                </Field>

                <Field className="flex-1 min-w-0">
                  <FieldLabel>Ayat Selesai</FieldLabel>
                  <Input
                    type="number"
                    value={endVerse}
                    onChange={(e) => setEndVerse(e.target.value)}
                    placeholder="7"
                  />
                </Field>
              </FieldGroup>
            </>
          )}

          {submissionType === SubmissionType.TAHSIN_WAFA && (
            <>
              <Field>
                <FieldLabel>Materi Wafa</FieldLabel>
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
              </Field>

              <FieldGroup className="flex flex-col md:flex-row gap-4">
                <Field className="flex-1 min-w-0">
                  <FieldLabel>Halaman Mulai</FieldLabel>
                  <Input
                    type="number"
                    value={startPage}
                    onChange={(e) => setStartPage(e.target.value)}
                    placeholder="1"
                  />
                </Field>
                <Field className="flex-1 min-w-0">
                  <FieldLabel>Halaman Selesai</FieldLabel>
                  <Input
                    type="number"
                    value={endPage}
                    onChange={(e) => setEndPage(e.target.value)}
                    placeholder="10"
                  />
                </Field>
              </FieldGroup>
            </>
          )}

          <FieldGroup className="flex flex-col md:flex-row gap-4">
            <Field className="flex-1 min-w-0">
              <FieldLabel>Status Setoran</FieldLabel>
              <Select
                value={submissionStatus}
                onValueChange={(val) => setSubmissionStatus(val as SubmissionStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SubmissionStatus.LULUS}>Lulus</SelectItem>
                  <SelectItem value={SubmissionStatus.TIDAK_LULUS}>Tidak Lulus</SelectItem>
                  <SelectItem value={SubmissionStatus.MENGULANG}>Mengulang</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field className="flex-1 min-w-0">
              <FieldLabel>Adab</FieldLabel>
              <Select value={adab} onValueChange={(val) => setAdab(val as Adab)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Adab" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Adab.BAIK}>Baik</SelectItem>
                  <SelectItem value={Adab.KURANG_BAIK}>Kurang Baik</SelectItem>
                  <SelectItem value={Adab.TIDAK_BAIK}>Tidak Baik</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <Field>
            <FieldLabel>Catatan</FieldLabel>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Masukkan catatan..."
              className="min-h-24"
            />
          </Field>
        </FieldSet>
      </CardContent>

      <CardFooter className="flex items-center justify-center">
        <Button onClick={handleSubmit} disabled={loading} className="w-48">
          {loading ? (
            <>
              <Spinner />
              Menyimpan...
            </>
          ) : (
            <>
              <Save />
              Simpan Setoran
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
