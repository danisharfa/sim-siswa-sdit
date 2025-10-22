'use client';

import { useMemo, useState } from 'react';
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
import { Calendar01 } from '@/components/layout/calendar/calendar-01';
import { SubmissionType, SubmissionStatus, Adab } from '@prisma/client';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';

interface Group {
  groupId: string;
  groupName: string;
  classroomName: string;
  classroomAcademicYear: string;
  classroomSemester: string;
}

interface Student {
  id: string;
  nis: string;
  fullName: string;
}

interface Juz {
  id: number;
  name: string;
}

interface Surah {
  id: number;
  name: string;
  verseCount: number;
}

interface SurahJuz {
  surah: Surah;
  juz: Juz;
}

interface Wafa {
  id: number;
  name: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SubmissionForm() {
  const [groupId, setGroupId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [submissionDate, setSubmissionDate] = useState<Date>();
  const [submissionType, setSubmissionType] = useState<SubmissionType>(SubmissionType.TAHFIDZ);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>(
    SubmissionStatus.LULUS
  );
  const [selectedJuz, setSelectedJuz] = useState('');
  const [selectedSurahId, setSelectedSurahId] = useState('');
  const [startVerse, setStartVerse] = useState('');
  const [endVerse, setEndVerse] = useState('');
  const [selectedWafaId, setSelectedWafaId] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [adab, setAdab] = useState<Adab>(Adab.BAIK);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: academic } = useSWR('/api/academicSetting', fetcher);
  const { data: groupResponse } = useSWR('/api/teacher/group', fetcher);
  const { data: studentResponse } = useSWR(
    groupId ? `/api/teacher/group/${groupId}/member` : null,
    fetcher
  );
  const { data: juzResponse } = useSWR('/api/juz', fetcher);
  const { data: surahJuzResponse } = useSWR('/api/surahJuz', fetcher);
  const { data: wafaResponse } = useSWR('/api/wafa', fetcher);

  const groupList = useMemo(() => {
    return groupResponse?.success ? groupResponse.data : [];
  }, [groupResponse]);

  const studentList = useMemo(() => {
    return studentResponse?.success ? studentResponse.data : [];
  }, [studentResponse]);

  const juzList = useMemo(() => {
    return juzResponse?.success ? juzResponse.data : [];
  }, [juzResponse]);

  const surahJuzList = useMemo(() => {
    return surahJuzResponse?.success ? surahJuzResponse.data : [];
  }, [surahJuzResponse]);

  const wafaList = useMemo(() => {
    return wafaResponse?.success ? wafaResponse.data : [];
  }, [wafaResponse]);

  const filteredGroupList = useMemo(() => {
    if (!academic?.success || !academic?.data || groupList.length === 0) return [];
    const { currentYear, currentSemester } = academic.data;
    return groupList.filter(
      (g: Group) =>
        g.classroomAcademicYear === currentYear && g.classroomSemester === currentSemester
    );
  }, [groupList, academic]);

  const filteredSurahJuz = useMemo(() => {
    return surahJuzList
      .filter((s: SurahJuz) => s.juz.id.toString() === selectedJuz)
      .sort((a: SurahJuz, b: SurahJuz) => a.surah.id - b.surah.id);
  }, [surahJuzList, selectedJuz]);

  // ===== EVENT HANDLERS =====
  const handleGroupChange = (newGroupId: string) => {
    setGroupId(newGroupId);
    setStudentId(''); // Reset student selection when group changes
  };

  const handleSubmissionTypeChange = (newType: SubmissionType) => {
    setSubmissionType(newType);
    // Reset all related fields when submission type changes
    setSelectedJuz('');
    setSelectedSurahId('');
    setStartVerse('');
    setEndVerse('');
    setSelectedWafaId('');
    setStartPage('');
    setEndPage('');
  };

  const handleJuzChange = (newJuz: string) => {
    setSelectedJuz(newJuz);
    setSelectedSurahId(''); // Reset surah when juz changes
  };

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
    if (!submissionDate) return toast.error('Tanggal setoran harus diisi');
    if (!groupId) return toast.error('Kelompok harus dipilih');
    if (!studentId) return toast.error('Siswa harus dipilih');
    if (!submissionType) return toast.error('Jenis setoran harus dipilih');
    if (!submissionStatus) return toast.error('Status setoran harus dipilih');
    if (!adab) return toast.error('Adab harus dipilih');
    if (
      submissionType === SubmissionType.TAHFIDZ ||
      submissionType === SubmissionType.TAHSIN_ALQURAN
    ) {
      if (!selectedJuz) return toast.error("Juz harus dipilih untuk Tahfidz/Tahsin Al-Qur'an");
      if (!selectedSurahId)
        return toast.error("Surah harus dipilih untuk Tahfidz/Tahsin Al-Qur'an");
      if (!startVerse) return toast.error("Ayat mulai harus diisi untuk Tahfidz/Tahsin Al-Qur'an");
      if (!endVerse) return toast.error("Ayat selesai harus diisi untuk Tahfidz/Tahsin Al-Qur'an");

      // Validasi range ayat
      const startVerseNum = parseInt(startVerse);
      const endVerseNum = parseInt(endVerse);
      if (startVerseNum > endVerseNum) {
        return toast.error('Ayat mulai tidak boleh lebih besar dari ayat selesai');
      }
      if (startVerseNum < 1) {
        return toast.error('Ayat mulai harus minimal 1');
      }
    }

    if (submissionType === SubmissionType.TAHSIN_WAFA) {
      if (!selectedWafaId) return toast.error('Materi Wafa harus dipilih untuk Tahsin Wafa');
      if (!startPage) return toast.error('Halaman mulai harus diisi untuk Tahsin Wafa');
      if (!endPage) return toast.error('Halaman selesai harus diisi untuk Tahsin Wafa');

      // Validasi range halaman
      const startPageNum = parseInt(startPage);
      const endPageNum = parseInt(endPage);
      if (startPageNum > endPageNum) {
        return toast.error('Halaman mulai tidak boleh lebih besar dari halaman selesai');
      }
      if (startPageNum < 1) {
        return toast.error('Halaman mulai harus minimal 1');
      }
    }

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
      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result.message || 'Gagal menyimpan setoran');
        return;
      }

      toast.success('Setoran berhasil disimpan');
      resetForm();
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan data');
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
              Tahun Ajaran: <strong>{academic.data.currentYear}</strong> – Semester:{' '}
              <strong>{academic.data.currentSemester}</strong>
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <FieldSet>
          <Field>
            <Calendar01
              value={submissionDate}
              onChange={setSubmissionDate}
              label="Tanggal Setoran"
            />
          </Field>

          <FieldGroup className="flex flex-col md:flex-row gap-4">
            <Field className="flex-1 min-w-0">
              <FieldLabel>Kelompok</FieldLabel>
              <Select value={groupId} onValueChange={handleGroupChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kelompok" />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroupList.map((group: Group) => (
                    <SelectItem key={group.groupId} value={group.groupId}>
                      {group.groupName} - {group.classroomName}
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
                  {studentList.map((s: Student) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName} ({s.nis})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <Field>
            <FieldLabel>Jenis Setoran</FieldLabel>
            <Select value={submissionType} onValueChange={handleSubmissionTypeChange}>
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
                  <Select value={selectedJuz} onValueChange={handleJuzChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Juz" />
                    </SelectTrigger>
                    <SelectContent>
                      {juzList.map((j: Juz) => (
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
                      {filteredSurahJuz.map((sj: SurahJuz) => (
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
                    {wafaList.map((w: Wafa) => (
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
              placeholder="Tambahkan catatan untuk setoran ini..."
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
