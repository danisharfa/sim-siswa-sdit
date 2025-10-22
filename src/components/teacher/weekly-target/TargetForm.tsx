'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
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
import { Spinner } from '@/components/ui/spinner';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { SubmissionType } from '@prisma/client';
import { type DateRange } from 'react-day-picker';
import { Calendar23 } from '@/components/layout/calendar/calendar-23';

interface SurahJuz {
  id: number;
  juzId: number;
  startVerse: number;
  endVerse: number;
  surah: { id: number; name: string; verseCount: number };
  juz: { id: number; name: string };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TargetForm() {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [type, setType] = useState<SubmissionType>('TAHFIDZ');
  const [description, setDescription] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>();
  const [isForAllStudents, setIsForAllStudents] = useState(false);
  const [startJuzId, setStartJuzId] = useState('');
  const [endJuzId, setEndJuzId] = useState('');
  const [surahStartId, setSurahStartId] = useState('');
  const [surahEndId, setSurahEndId] = useState('');
  const [startAyat, setStartAyat] = useState('');
  const [endAyat, setEndAyat] = useState('');
  const [wafaId, setWafaId] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [loading, setLoading] = useState(false);

  // ===== SWR DATA FETCHING =====
  const { data: academicSetting } = useSWR('/api/academicSetting', fetcher);
  const { data: groupResponse } = useSWR('/api/teacher/group', fetcher);
  const { data: studentResponse } = useSWR(
    selectedGroupId ? `/api/teacher/group/${selectedGroupId}/member` : null,
    fetcher
  );
  const { data: juzResponse } = useSWR('/api/juz', fetcher);
  const { data: surahJuzResponse } = useSWR('/api/surahJuz', fetcher);
  const { data: wafaResponse } = useSWR('/api/wafa', fetcher);

  // ===== COMPUTED VALUES =====
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
    if (!academicSetting?.success || !academicSetting?.data || groupList.length === 0) return [];
    const { currentYear, currentSemester } = academicSetting.data;
    return groupList.filter(
      (g: { classroomAcademicYear: string; classroomSemester: string }) =>
        g.classroomAcademicYear === currentYear && g.classroomSemester === currentSemester
    );
  }, [groupList, academicSetting]);

  const filteredSurahStart = useMemo(() => {
    return surahJuzList
      .filter((s: SurahJuz) => s.juzId.toString() === startJuzId)
      .sort((a: SurahJuz, b: SurahJuz) => a.surah.id - b.surah.id);
  }, [surahJuzList, startJuzId]);

  const filteredSurahEnd = useMemo(() => {
    return surahJuzList
      .filter((s: SurahJuz) => s.juzId.toString() === endJuzId)
      .sort((a: SurahJuz, b: SurahJuz) => a.surah.id - b.surah.id);
  }, [surahJuzList, endJuzId]);

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
    setSelectedGroupId('');
  };

  const handleSubmit = async () => {
    if (!academicSetting?.data) return;

    // Basic validations
    if (!dateRange?.from || !dateRange?.to)
      return toast.error('Silakan pilih tanggal awal dan akhir target');
    if (!selectedGroupId) return toast.error('Silakan pilih kelompok');
    if (!isForAllStudents && !selectedStudentId)
      return toast.error('Silakan pilih siswa atau centang "Untuk semua siswa"');
    if (!type) return toast.error('Silakan pilih jenis setoran');

    // Type-specific validations
    if (type === 'TAHFIDZ' || type === 'TAHSIN_ALQURAN') {
      if (!startJuzId) return toast.error('Silakan pilih juz awal');
      if (!endJuzId) return toast.error('Silakan pilih juz akhir');
      if (!surahStartId) return toast.error('Silakan pilih surah awal');
      if (!surahEndId) return toast.error('Silakan pilih surah akhir');
      if (!startAyat) return toast.error('Silakan isi ayat awal');
      if (!endAyat) return toast.error('Silakan isi ayat akhir');

      const startAyatNum = parseInt(startAyat);
      const endAyatNum = parseInt(endAyat);
      if (isNaN(startAyatNum) || startAyatNum < 1)
        return toast.error('Ayat awal harus berupa angka positif');
      if (isNaN(endAyatNum) || endAyatNum < 1)
        return toast.error('Ayat akhir harus berupa angka positif');
      if (endAyatNum < startAyatNum)
        return toast.error('Ayat akhir tidak boleh kurang dari ayat awal');
    }

    if (type === 'TAHSIN_WAFA') {
      if (!wafaId) return toast.error('Silakan pilih materi Wafa');
      if (!startPage) return toast.error('Silakan isi halaman mulai');
      if (!endPage) return toast.error('Silakan isi halaman akhir');

      const startPageNum = parseInt(startPage);
      const endPageNum = parseInt(endPage);
      if (isNaN(startPageNum) || startPageNum < 1)
        return toast.error('Halaman mulai harus berupa angka positif');
      if (isNaN(endPageNum) || endPageNum < 1)
        return toast.error('Halaman akhir harus berupa angka positif');
      if (endPageNum < startPageNum)
        return toast.error('Halaman akhir tidak boleh kurang dari halaman mulai');
    }

    const targetStudents = isForAllStudents
      ? studentList
      : studentList.filter((s: { id: string }) => s.id === selectedStudentId);

    if (targetStudents.length === 0) return toast.error('Tidak ada siswa yang dipilih');

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
      const responses = await Promise.all(
        targetStudents.map((student: { id: string }) =>
          fetch('/api/teacher/weekly-target', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...basePayload, studentId: student.id }),
          })
        )
      );

      const results = await Promise.all(responses.map((r) => r.json()));
      const failed = results.filter((r) => !r.success);
      if (failed.length) throw new Error(`${failed.length} target gagal disimpan`);

      toast.success(`Target berhasil disimpan untuk ${targetStudents.length} siswa`);
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan target');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Target Setoran</CardTitle>
        <CardDescription>
          {academicSetting?.success && (
            <span className="text-sm text-muted-foreground">
              Tahun Ajaran: <strong>{academicSetting.data.currentYear}</strong> – Semester:{' '}
              <strong>{academicSetting.data.currentSemester}</strong>
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <FieldSet>
          <Field>
            <Calendar23 value={dateRange} onChange={setDateRange} label="Rentang Target" />
          </Field>

          <FieldGroup className="flex flex-col md:flex-row gap-4">
            <Field className="flex-1 min-w-0">
              <FieldLabel>
                Kelompok
              </FieldLabel>
              <Select
                value={selectedGroupId}
                onValueChange={(value) => {
                  setSelectedGroupId(value);
                  setSelectedStudentId('');
                  setIsForAllStudents(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelompok" />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroupList.map(
                    (group: { groupId: string; groupName: string; classroomName: string }) => (
                      <SelectItem key={group.groupId} value={group.groupId}>
                        {group.groupName} - {group.classroomName}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <FieldLabel>
                  Siswa
                </FieldLabel>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    id="allStudents"
                    checked={isForAllStudents}
                    onChange={(e) => {
                      setIsForAllStudents(e.target.checked);
                      if (e.target.checked) setSelectedStudentId('');
                    }}
                    disabled={!selectedGroupId}
                  />
                  Untuk semua siswa
                </label>
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
                    {studentList.map((s: { id: string; fullName: string; nis: string }) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.fullName} ({s.nis})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 bg-muted rounded-lg border text-sm text-muted-foreground">
                  Target akan dibuat untuk semua {studentList.length} siswa dalam kelompok ini.
                </div>
              )}
            </Field>
          </FieldGroup>

          <Field>
            <FieldLabel>
              Jenis Setoran
            </FieldLabel>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as SubmissionType);
                // Reset related fields when type changes
                setStartJuzId('');
                setEndJuzId('');
                setSurahStartId('');
                setSurahEndId('');
                setStartAyat('');
                setEndAyat('');
                setWafaId('');
                setStartPage('');
                setEndPage('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SubmissionType.TAHFIDZ}>Tahfidz</SelectItem>
                <SelectItem value={SubmissionType.TAHSIN_WAFA}>Tahsin (Wafa)</SelectItem>
                <SelectItem value={SubmissionType.TAHSIN_ALQURAN}>Tahsin (Al-Quran)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {(type === SubmissionType.TAHFIDZ || type === SubmissionType.TAHSIN_ALQURAN) && (
            <>
              <FieldGroup className="flex flex-col md:flex-row gap-4">
                <Field className="flex-1 min-w-0">
                  <FieldLabel>
                    Juz Awal
                  </FieldLabel>
                  <Select value={startJuzId} onValueChange={setStartJuzId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Juz Awal" />
                    </SelectTrigger>
                    <SelectContent>
                      {juzList.map((j: { id: number; name: string }) => (
                        <SelectItem key={j.id} value={j.id.toString()}>
                          {j.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field className="flex-1 min-w-0">
                  <FieldLabel>
                    Juz Akhir
                  </FieldLabel>
                  <Select value={endJuzId} onValueChange={setEndJuzId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Juz Akhir" />
                    </SelectTrigger>
                    <SelectContent>
                      {juzList.map((j: { id: number; name: string }) => (
                        <SelectItem key={j.id} value={j.id.toString()}>
                          {j.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>

              <FieldGroup className="flex flex-col md:flex-row gap-4">
                <Field className="flex-1 min-w-0">
                  <FieldLabel>
                    Surah Awal
                  </FieldLabel>
                  <Select value={surahStartId} onValueChange={setSurahStartId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Surah Awal" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSurahStart.map((s: SurahJuz) => (
                        <SelectItem key={s.surah.id} value={s.surah.id.toString()}>
                          {s.surah.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field className="flex-1 min-w-0">
                  <FieldLabel>
                    Surah Akhir
                  </FieldLabel>
                  <Select value={surahEndId} onValueChange={setSurahEndId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Surah Akhir" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSurahEnd.map((s: SurahJuz) => (
                        <SelectItem key={s.surah.id} value={s.surah.id.toString()}>
                          {s.surah.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>

              <FieldGroup className="flex flex-col md:flex-row gap-4">
                <Field className="flex-1 min-w-0">
                  <FieldLabel>
                    Ayat Awal
                  </FieldLabel>
                  <Input
                    type="number"
                    value={startAyat}
                    onChange={(e) => setStartAyat(e.target.value)}
                    placeholder="1"
                  />
                </Field>
                <Field className="flex-1 min-w-0">
                  <FieldLabel>
                    Ayat Akhir
                  </FieldLabel>
                  <Input
                    type="number"
                    value={endAyat}
                    onChange={(e) => setEndAyat(e.target.value)}
                    placeholder="1"
                  />
                </Field>
              </FieldGroup>
            </>
          )}

          {type === SubmissionType.TAHSIN_WAFA && (
            <>
              <Field>
                <FieldLabel>
                  Materi Wafa
                </FieldLabel>
                <Select value={wafaId} onValueChange={setWafaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Wafa" />
                  </SelectTrigger>
                  <SelectContent>
                    {wafaList.map((w: { id: number; name: string }) => (
                      <SelectItem key={w.id} value={w.id.toString()}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <FieldGroup className="flex flex-col md:flex-row gap-4">
                <Field className="flex-1 min-w-0">
                  <FieldLabel>
                    Halaman Mulai
                  </FieldLabel>
                  <Input
                    type="number"
                    value={startPage}
                    onChange={(e) => setStartPage(e.target.value)}
                    placeholder="1"
                  />
                </Field>
                <Field className="flex-1 min-w-0">
                  <FieldLabel>
                    Halaman Selesai
                  </FieldLabel>
                  <Input
                    type="number"
                    value={endPage}
                    onChange={(e) => setEndPage(e.target.value)}
                    placeholder="1"
                  />
                </Field>
              </FieldGroup>
            </>
          )}

          <Field>
            <FieldLabel>Deskripsi</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan deskripsi untuk target ini..."
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
              Simpan Target
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
