'use client';

import { useEffect, useState, useMemo } from 'react';
import useSWR from 'swr';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { MunaqasyahBatch, MunaqasyahStage } from '@prisma/client';

interface MunaqasyahSchedule {
  id: string;
  date: string;
  sessionName: string;
  startTime: string;
  endTime: string;
}

interface StudentUserLite {
  fullName: string;
}

interface StudentLite {
  nis: string;
  user: StudentUserLite;
}

interface JuzLite {
  id: number;
  name: string;
}

interface StudentRequest {
  requestId: string;
  scheduleId: string;
  batch: MunaqasyahBatch;
  stage: MunaqasyahStage;
  juz?: JuzLite;
  student: StudentLite;
  result?: { id: string } | null;
}

interface SurahLite {
  id: number;
  name: string;
}

interface SurahJuzItem {
  id: number;
  surahId: number;
  juzId: number;
  startVerse: number;
  endVerse: number;
  surah: SurahLite;
  juz: JuzLite;
}

type TasmiDetailInput = {
  surahId: number;
  initialScore: number; // >= 1, bisa > 100
  khofiAwalAyat: number;
  khofiMakhroj: number;
  khofiTajwidMad: number;
  jaliBaris: number;
  jaliLebihSatuKalimat: number;
  note?: string;
};

type MunaqasyahDetailInput = {
  questionNo: number; // 1..5
  khofiAwalAyat: number;
  khofiMakhroj: number;
  khofiTajwidMad: number;
  jaliBaris: number;
  jaliLebihSatuKalimat: number;
  note?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// utils perhitungan
const calcTasmiRowTotal = (row: TasmiDetailInput): number => {
  const khofi = (row.khofiAwalAyat ?? 0) + (row.khofiMakhroj ?? 0) + (row.khofiTajwidMad ?? 0);
  const jali = (row.jaliBaris ?? 0) + (row.jaliLebihSatuKalimat ?? 0);
  const raw = (row.initialScore ?? 0) - 2 * khofi - 5 * jali;
  // Return raw score (mentah), tidak dinormalisasi disini
  return Math.max(0, raw);
};

const calcTasmiRowPercent = (row: TasmiDetailInput): number => {
  const rawTotal = calcTasmiRowTotal(row);
  const initialScore = row.initialScore ?? 0;
  // Normalisasi ke 0-100
  return initialScore > 0 ? (rawTotal / initialScore) * 100 : 0;
};

const calcMunaRowTotal = (row: MunaqasyahDetailInput): number => {
  const khofi = (row.khofiAwalAyat ?? 0) + (row.khofiMakhroj ?? 0) + (row.khofiTajwidMad ?? 0);
  const jali = (row.jaliBaris ?? 0) + (row.jaliLebihSatuKalimat ?? 0);
  const raw = 50 - 2 * khofi - 3 * jali;
  // Return raw score basis 50
  return Math.max(0, raw);
};

const calcMunaRowPercent = (row: MunaqasyahDetailInput): number => {
  const rawTotal = calcMunaRowTotal(row);
  // Normalisasi ke 0-100
  return (rawTotal / 50) * 100;
};

export function MunaqasyahResultForm({ onSaved }: { onSaved: () => void }) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<StudentRequest | null>(null);

  // jadwal + daftar siswa pada jadwal
  const { data: schedules } = useSWR('/api/coordinator/munaqasyah/schedule/available', fetcher);
  const { data: studentsResponse, mutate } = useSWR(
    selectedScheduleId ? `/api/coordinator/munaqasyah/result/schedule/${selectedScheduleId}` : null,
    fetcher
  );
  const students: StudentRequest[] = useMemo(
    () => studentsResponse?.data ?? [],
    [studentsResponse?.data]
  );

  // data surah-juz (global), lalu difilter berdasarkan juz request
  const { data: surahJuzResponse } = useSWR('/api/surahJuz', fetcher);
  const allSurahJuz: SurahJuzItem[] = useMemo(
    () => surahJuzResponse?.data ?? [],
    [surahJuzResponse?.data]
  );

  // ---- TASMI rows: otomatis dari semua surah pada Juz request
  const [tasmiRows, setTasmiRows] = useState<TasmiDetailInput[]>([]);

  // ---- MUNAQASYAH rows: fixed 5
  const [munaqasyahRows, setMunaqasyahRows] = useState<MunaqasyahDetailInput[]>(
    Array.from({ length: 5 }, (_, i) => ({
      questionNo: i + 1,
      khofiAwalAyat: 0,
      khofiMakhroj: 0,
      khofiTajwidMad: 0,
      jaliBaris: 0,
      jaliLebihSatuKalimat: 0,
      note: '',
    }))
  );

  const resetForm = () => {
    setSelectedRequestId(null);
    setSelectedRequest(null);
    setTasmiRows([]);
    setMunaqasyahRows(
      Array.from({ length: 5 }, (_, i) => ({
        questionNo: i + 1,
        khofiAwalAyat: 0,
        khofiMakhroj: 0,
        khofiTajwidMad: 0,
        jaliBaris: 0,
        jaliLebihSatuKalimat: 0,
        note: '',
      }))
    );
  };

  useEffect(() => {
    resetForm();
  }, [selectedScheduleId]);

  useEffect(() => {
    if (selectedRequestId) {
      const request = students.find((s) => s.requestId === selectedRequestId) ?? null;
      setSelectedRequest(request);
    } else {
      setSelectedRequest(null);
    }
  }, [selectedRequestId, students]);

  // generate tasmiRows otomatis ketika request (juz) tersedia & stage = TASMI
  useEffect(() => {
    if (
      !selectedRequest ||
      selectedRequest.stage !== MunaqasyahStage.TASMI ||
      !selectedRequest.juz?.id
    ) {
      setTasmiRows([]);
      return;
    }
    const juzId = selectedRequest.juz.id;
    const surahForJuz = allSurahJuz
      .filter((sj) => sj.juzId === juzId)
      .sort((a, b) => a.surah.id - b.surah.id) // urutkan sesuai nomor surah
      .map<TasmiDetailInput>((sj) => ({
        surahId: sj.surah.id,
        initialScore: 100, // Default starting value, user can change
        khofiAwalAyat: 0,
        khofiMakhroj: 0,
        khofiTajwidMad: 0,
        jaliBaris: 0,
        jaliLebihSatuKalimat: 0,
        note: '',
      }));
    setTasmiRows(surahForJuz);
  }, [selectedRequest, allSurahJuz]);

  // UI helpers
  const handleChangeTasmi = (idx: number, patch: Partial<TasmiDetailInput>) => {
    setTasmiRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const handleChangeMuna = (idx: number, patch: Partial<MunaqasyahDetailInput>) => {
    setMunaqasyahRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  // total rata-rata (normalized 0-100 untuk preview)
  const tasmiAverage = useMemo(() => {
    if (tasmiRows.length === 0) return 0;
    const percentages = tasmiRows.map((row) => calcTasmiRowPercent(row));
    return percentages.reduce((acc, p) => acc + p, 0) / percentages.length;
  }, [tasmiRows]);

  const munaAverage = useMemo(() => {
    const percentages = munaqasyahRows.map((row) => calcMunaRowPercent(row));
    return percentages.reduce((acc, p) => acc + p, 0) / percentages.length; // 5 rows
  }, [munaqasyahRows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId || !selectedRequestId || !selectedRequest) {
      toast.error('Harap lengkapi semua data');
      return;
    }

    if (selectedRequest.stage === MunaqasyahStage.TASMI) {
      if (tasmiRows.length === 0) {
        toast.error('Daftar surah untuk Tasmi belum terbentuk');
        return;
      }
      for (const row of tasmiRows) {
        if (row.initialScore < 1) {
          toast.error('Nilai awal Tasmi harus minimal 1');
          return;
        }
        // pastikan non-negatif
        if (
          row.khofiAwalAyat < 0 ||
          row.khofiMakhroj < 0 ||
          row.khofiTajwidMad < 0 ||
          row.jaliBaris < 0 ||
          row.jaliLebihSatuKalimat < 0
        ) {
          toast.error('Jumlah kesalahan tidak boleh negatif');
          return;
        }
      }
    } else {
      // Munaqasyah 5 rows fixed
      for (const row of munaqasyahRows) {
        if (
          row.khofiAwalAyat < 0 ||
          row.khofiMakhroj < 0 ||
          row.khofiTajwidMad < 0 ||
          row.jaliBaris < 0 ||
          row.jaliLebihSatuKalimat < 0
        ) {
          toast.error('Jumlah kesalahan tidak boleh negatif');
          return;
        }
      }
    }

    const payload =
      selectedRequest.stage === MunaqasyahStage.TASMI
        ? {
            scheduleId: selectedScheduleId,
            requestId: selectedRequestId,
            stage: selectedRequest.stage,
            tasmiDetails: tasmiRows.map((r) => ({
              ...r,
              // totalScore dihitung backend; kita hanya kirim input
            })),
          }
        : {
            scheduleId: selectedScheduleId,
            requestId: selectedRequestId,
            stage: selectedRequest.stage,
            munaqasyahDetails: munaqasyahRows.map((r) => ({
              ...r,
              // initialScore 50 & totalScore dihitung backend
            })),
          };

    const res = await fetch('/api/coordinator/munaqasyah/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json: { success: boolean; message?: string } = await res.json();

    if (json.success) {
      toast.success(json.message || 'Hasil berhasil disimpan');
      // jangan reset schedule agar bisa lanjut nilai siswa lain pada sesi yang sama
      setSelectedRequestId(null);
      setSelectedRequest(null);
      setTasmiRows([]);
      setMunaqasyahRows(
        Array.from({ length: 5 }, (_, i) => ({
          questionNo: i + 1,
          khofiAwalAyat: 0,
          khofiMakhroj: 0,
          khofiTajwidMad: 0,
          jaliBaris: 0,
          jaliLebihSatuKalimat: 0,
          note: '',
        }))
      );
      onSaved();
      mutate();
    } else {
      toast.error(json.message || 'Gagal menyimpan hasil');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Form Penilaian Munaqasyah</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-2 block">Pilih Jadwal Munaqasyah</Label>
            <Select onValueChange={setSelectedScheduleId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih sesi munaqasyah" />
              </SelectTrigger>
              <SelectContent>
                {(schedules?.data as MunaqasyahSchedule[] | undefined)?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {new Date(s.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    - {s.sessionName} ({s.startTime} - {s.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedScheduleId && students.length > 0 && (
            <>
              <div>
                <Label className="mb-2 block">Pilih Siswa</Label>
                <Select
                  onValueChange={setSelectedRequestId}
                  disabled={students.filter((s) => !s.result).length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        students.filter((s) => !s.result).length === 0
                          ? 'Tidak ada siswa yang perlu dinilai'
                          : 'Pilih siswa'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {students
                      .filter((s) => !s.result)
                      .map((s) => (
                        <SelectItem key={s.requestId} value={s.requestId}>
                          {s.student.user.fullName} | {s.juz?.name ?? '-'} | {s.batch} |{' '}
                          {s.stage === MunaqasyahStage.TASMI ? 'Tasmi' : 'Munaqasyah'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRequest && (
                <>
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-medium mb-2">
                      Tahap:{' '}
                      {selectedRequest.stage === MunaqasyahStage.TASMI ? 'Tasmi' : 'Munaqasyah'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Siswa: {selectedRequest.student.user.fullName} | Juz:{' '}
                      {selectedRequest.juz?.name} | Batch: {selectedRequest.batch}
                    </p>
                  </div>

                  {selectedRequest.stage === MunaqasyahStage.TASMI ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Detail Tasmi per Surah</h4>
                        <div className="text-sm text-muted-foreground">
                          Rata-rata Tasmi: <b>{tasmiAverage.toFixed(1)}</b>
                        </div>
                      </div>

                      {tasmiRows.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Memuat daftar surah berdasarkan Juz...
                        </p>
                      )}

                      {tasmiRows.map((row, idx) => {
                        // cari nama surah dari allSurahJuz
                        const surahName =
                          allSurahJuz.find((sj) => sj.surahId === row.surahId)?.surah.name ??
                          `Surah ${row.surahId}`;
                        const percent = calcTasmiRowPercent(row);

                        return (
                          <div
                            key={`${row.surahId}-${idx}`}
                            className="grid grid-cols-1 md:grid-cols-8 gap-2 items-end border rounded-md p-3"
                          >
                            <div className="md:col-span-2">
                              <Label>Surah</Label>
                              <Input value={surahName} readOnly />
                            </div>
                            <div>
                              <Label>Nilai Awal (≥ 1)</Label>
                              <Input
                                type="number"
                                value={row.initialScore}
                                min={1}
                                onChange={(e) =>
                                  handleChangeTasmi(idx, { initialScore: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div>
                              <Label>Khofi: Awal Ayat</Label>
                              <Input
                                type="number"
                                min={0}
                                value={row.khofiAwalAyat}
                                onChange={(e) =>
                                  handleChangeTasmi(idx, { khofiAwalAyat: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div>
                              <Label>Khofi: Makhroj</Label>
                              <Input
                                type="number"
                                min={0}
                                value={row.khofiMakhroj}
                                onChange={(e) =>
                                  handleChangeTasmi(idx, { khofiMakhroj: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div>
                              <Label>Khofi: Tajwid/Mad</Label>
                              <Input
                                type="number"
                                min={0}
                                value={row.khofiTajwidMad}
                                onChange={(e) =>
                                  handleChangeTasmi(idx, { khofiTajwidMad: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div>
                              <Label>Jali: Baris</Label>
                              <Input
                                type="number"
                                min={0}
                                value={row.jaliBaris}
                                onChange={(e) =>
                                  handleChangeTasmi(idx, { jaliBaris: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div>
                              <Label>Jali: &gt;1 Kalimat</Label>
                              <Input
                                type="number"
                                min={0}
                                value={row.jaliLebihSatuKalimat}
                                onChange={(e) =>
                                  handleChangeTasmi(idx, {
                                    jaliLebihSatuKalimat: Number(e.target.value),
                                  })
                                }
                              />
                            </div>

                            <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                              <div className="md:col-span-5">
                                <Label>Catatan</Label>
                                <Textarea
                                  value={row.note ?? ''}
                                  onChange={(e) => handleChangeTasmi(idx, { note: e.target.value })}
                                />
                              </div>
                              <div className="md:col-span-1">
                                <Label>Total (%)</Label>
                                <Input value={`${percent.toFixed(1)}%`} readOnly />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Detail Munaqasyah (5 Soal)</h4>
                        <div className="text-sm text-muted-foreground">
                          Rata-rata Munaqasyah: <b>{munaAverage.toFixed(1)}</b>
                        </div>
                      </div>

                      {munaqasyahRows.map((row, idx) => {
                        // const total = calcMunaRowTotal(row);
                        const percent = calcMunaRowPercent(row);
                        return (
                          <div
                            key={row.questionNo}
                            className="grid grid-cols-1 md:grid-cols-7 gap-2 border rounded-md p-3"
                          >
                            <div>
                              <Label>Soal #{row.questionNo}</Label>
                              <Input value={row.questionNo} readOnly />
                            </div>
                            <div>
                              <Label>Khofi: Awal Ayat</Label>
                              <Input
                                type="number"
                                min={0}
                                value={row.khofiAwalAyat}
                                onChange={(e) =>
                                  handleChangeMuna(idx, { khofiAwalAyat: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div>
                              <Label>Khofi: Makhroj</Label>
                              <Input
                                type="number"
                                min={0}
                                value={row.khofiMakhroj}
                                onChange={(e) =>
                                  handleChangeMuna(idx, { khofiMakhroj: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div>
                              <Label>Khofi: Tajwid/Mad</Label>
                              <Input
                                type="number"
                                min={0}
                                value={row.khofiTajwidMad}
                                onChange={(e) =>
                                  handleChangeMuna(idx, { khofiTajwidMad: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div>
                              <Label>Jali: Baris</Label>
                              <Input
                                type="number"
                                min={0}
                                value={row.jaliBaris}
                                onChange={(e) =>
                                  handleChangeMuna(idx, { jaliBaris: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div>
                              <Label>Jali: &gt;1 Kalimat</Label>
                              <Input
                                type="number"
                                min={0}
                                value={row.jaliLebihSatuKalimat}
                                onChange={(e) =>
                                  handleChangeMuna(idx, {
                                    jaliLebihSatuKalimat: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div>
                              {/* <Label>Total (Raw / %)</Label>
                              <Input value={`${total} / ${percent.toFixed(1)}%`} readOnly /> */}
                              <Label>Total (%)</Label>
                                <Input value={`${percent.toFixed(1)}%`} readOnly />
                            </div>
                            <div className="md:col-span-7">
                              <Label>Catatan</Label>
                              <Textarea
                                value={row.note ?? ''}
                                onChange={(e) => handleChangeMuna(idx, { note: e.target.value })}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Button type="submit" className="w-full">
                    Simpan Hasil
                  </Button>
                </>
              )}
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
