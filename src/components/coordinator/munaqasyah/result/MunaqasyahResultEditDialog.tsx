'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MunaqasyahStage, MunaqasyahBatch } from '@prisma/client';
import { toast } from 'sonner';
import useSWR from 'swr';

interface TasmiDetailInput {
  surahId: number;
  surahName?: string;
  initialScore: number;
  khofiAwalAyat: number;
  khofiMakhroj: number;
  khofiTajwidMad: number;
  jaliBaris: number;
  jaliLebihSatuKalimat: number;
  note?: string;
}

interface MunaqasyahDetailInput {
  questionNo: number;
  khofiAwalAyat: number;
  khofiMakhroj: number;
  khofiTajwidMad: number;
  jaliBaris: number;
  jaliLebihSatuKalimat: number;
  note?: string;
}

interface SurahJuz {
  juzId: number;
  surah: {
    id: number;
    name: string;
  };
}

interface ExistingDetail {
  surahId?: number;
  questionNo?: number;
  initialScore: number;
  khofiAwalAyat: number;
  khofiMakhroj: number;
  khofiTajwidMad: number;
  jaliBaris: number;
  jaliLebihSatuKalimat: number;
  note?: string;
}

interface MunaqasyahResultEditDialogProps {
  result: {
    id: string;
    score: number;
    grade: string;
    passed: boolean;
    batch: MunaqasyahBatch;
    stage: MunaqasyahStage;
    juz: { name: string };
    schedule: {
      date: string;
      sessionName: string;
    };
    student: {
      nis: string;
      user: { fullName: string };
    };
    scoreDetails?: {
      tasmi?: { totalScore: number } | null;
      munaqasyah?: { totalScore: number } | null;
    };
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Helper functions for calculations
const calcTasmiRowTotal = (row: TasmiDetailInput): number => {
  const khofi = (row.khofiAwalAyat ?? 0) + (row.khofiMakhroj ?? 0) + (row.khofiTajwidMad ?? 0);
  const jali = (row.jaliBaris ?? 0) + (row.jaliLebihSatuKalimat ?? 0);
  const raw = (row.initialScore ?? 0) - 2 * khofi - 5 * jali;
  return Math.max(0, raw);
};

const calcTasmiRowPercent = (row: TasmiDetailInput): number => {
  const rawTotal = calcTasmiRowTotal(row);
  const initialScore = row.initialScore ?? 0;
  return initialScore > 0 ? (rawTotal / initialScore) * 100 : 0;
};

const calcMunaRowTotal = (row: MunaqasyahDetailInput): number => {
  const khofi = (row.khofiAwalAyat ?? 0) + (row.khofiMakhroj ?? 0) + (row.khofiTajwidMad ?? 0);
  const jali = (row.jaliBaris ?? 0) + (row.jaliLebihSatuKalimat ?? 0);
  const raw = 50 - 2 * khofi - 3 * jali;
  return Math.max(0, raw);
};

const calcMunaRowPercent = (row: MunaqasyahDetailInput): number => {
  const rawTotal = calcMunaRowTotal(row);
  return (rawTotal / 50) * 100;
};

const stageLabels: Record<MunaqasyahStage, string> = {
  [MunaqasyahStage.TASMI]: 'Tasmi',
  [MunaqasyahStage.MUNAQASYAH]: 'Munaqasyah',
};

const batchLabels: Record<MunaqasyahBatch, string> = {
  [MunaqasyahBatch.TAHAP_1]: 'Tahap 1',
  [MunaqasyahBatch.TAHAP_2]: 'Tahap 2',
  [MunaqasyahBatch.TAHAP_3]: 'Tahap 3',
  [MunaqasyahBatch.TAHAP_4]: 'Tahap 4',
};

export function MunaqasyahResultEditDialog({
  result,
  open,
  onOpenChange,
  onSave,
}: MunaqasyahResultEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [tasmiRows, setTasmiRows] = useState<TasmiDetailInput[]>([]);
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

  // Get surah-juz data for TASMI stage
  const { data: surahJuzResponse } = useSWR('/api/surahJuz', fetcher);
  const allSurahJuz = useMemo(
    () => (surahJuzResponse?.data as SurahJuz[]) ?? [],
    [surahJuzResponse?.data]
  );

  // Get existing result details
  const { data: existingDetails } = useSWR(
    result ? `/api/coordinator/munaqasyah/result/${result.id}/details` : null,
    fetcher
  );

  // Initialize form data based on stage and existing data
  useEffect(() => {
    if (result && result.stage === MunaqasyahStage.TASMI && allSurahJuz.length > 0) {
      // For TASMI, get all surah for the juz
      const juzName = result.juz.name;
      const juzId = parseInt(juzName.replace('Juz ', ''));

      const surahForJuz = allSurahJuz
        .filter((sj) => sj.juzId === juzId)
        .sort((a, b) => a.surah.id - b.surah.id)
        .map((sj) => ({
          surahId: sj.surah.id,
          surahName: sj.surah.name,
          initialScore: 100,
          khofiAwalAyat: 0,
          khofiMakhroj: 0,
          khofiTajwidMad: 0,
          jaliBaris: 0,
          jaliLebihSatuKalimat: 0,
          note: '',
        }));

      // Merge with existing data if available
      if (existingDetails?.tasmiDetails) {
        const mergedData = surahForJuz.map((surah) => {
          const existing = existingDetails.tasmiDetails.find(
            (t: ExistingDetail) => t.surahId === surah.surahId
          );
          return existing ? { ...surah, ...existing } : surah;
        });
        setTasmiRows(mergedData);
      } else {
        setTasmiRows(surahForJuz);
      }
    }

    if (result && result.stage === MunaqasyahStage.MUNAQASYAH) {
      // For MUNAQASYAH, initialize 5 questions
      const initialData = Array.from({ length: 5 }, (_, i) => ({
        questionNo: i + 1,
        khofiAwalAyat: 0,
        khofiMakhroj: 0,
        khofiTajwidMad: 0,
        jaliBaris: 0,
        jaliLebihSatuKalimat: 0,
        note: '',
      }));

      // Merge with existing data if available
      if (existingDetails?.munaqasyahDetails) {
        const mergedData = initialData.map((question) => {
          const existing = existingDetails.munaqasyahDetails.find(
            (m: ExistingDetail) => m.questionNo === question.questionNo
          );
          return existing ? { ...question, ...existing } : question;
        });
        setMunaqasyahRows(mergedData);
      } else {
        setMunaqasyahRows(initialData);
      }
    }
  }, [result, allSurahJuz, existingDetails]);

  // Helper functions for form updates
  const handleChangeTasmi = (idx: number, patch: Partial<TasmiDetailInput>) => {
    setTasmiRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleChangeMuna = (idx: number, patch: Partial<MunaqasyahDetailInput>) => {
    setMunaqasyahRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  // Calculate averages
  const tasmiAverage = useMemo(() => {
    if (tasmiRows.length === 0) return 0;
    const percentages = tasmiRows.map((row) => calcTasmiRowPercent(row));
    return percentages.reduce((acc, p) => acc + p, 0) / percentages.length;
  }, [tasmiRows]);

  const munaAverage = useMemo(() => {
    const percentages = munaqasyahRows.map((row) => calcMunaRowPercent(row));
    return percentages.reduce((acc, p) => acc + p, 0) / percentages.length;
  }, [munaqasyahRows]);

  async function handleSave() {
    setLoading(true);

    try {
      const requestData = {
        tasmiDetails: result.stage === MunaqasyahStage.TASMI ? tasmiRows : undefined,
        munaqasyahDetails: result.stage === MunaqasyahStage.MUNAQASYAH ? munaqasyahRows : undefined,
      };

      const res = await fetch(`/api/coordinator/munaqasyah/result/${result.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        toast.error(data?.message || 'Gagal mengedit hasil munaqasyah');
        return;
      }

      toast.success(data.message || 'Hasil munaqasyah berhasil diedit');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Hasil Munaqasyah</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Siswa */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              Siswa: {result.student.user.fullName} ({result.student.nis})
            </p>
            <p className="text-xs text-muted-foreground">
              {result.schedule.sessionName} -{' '}
              {new Date(result.schedule.date).toLocaleDateString('id-ID')}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{batchLabels[result.batch]}</Badge>
              <Badge variant="default">{stageLabels[result.stage]}</Badge>
              <Badge variant="secondary">{result.juz.name}</Badge>
            </div>
          </div>

          {/* TASMI Section */}
          {result.stage === MunaqasyahStage.TASMI && (
            <div className="space-y-3">
              <h3 className="font-semibold">Penilaian Tasmi</h3>
              <div className="space-y-2">
                {tasmiRows.map((row, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="font-medium">Surah {row.surahName || row.surahId}</Label>
                      <Badge variant="outline">Nilai: {calcTasmiRowPercent(row).toFixed(1)}%</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Nilai Awal</Label>
                        <Input
                          type="number"
                          min="0"
                          max="200"
                          value={row.initialScore}
                          onChange={(e) =>
                            handleChangeTasmi(idx, { initialScore: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Khofi Awal Ayat</Label>
                        <Input
                          type="number"
                          min="0"
                          value={row.khofiAwalAyat}
                          onChange={(e) =>
                            handleChangeTasmi(idx, { khofiAwalAyat: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Khofi Makhroj</Label>
                        <Input
                          type="number"
                          min="0"
                          value={row.khofiMakhroj}
                          onChange={(e) =>
                            handleChangeTasmi(idx, { khofiMakhroj: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Khofi Tajwid/Mad</Label>
                        <Input
                          type="number"
                          min="0"
                          value={row.khofiTajwidMad}
                          onChange={(e) =>
                            handleChangeTasmi(idx, {
                              khofiTajwidMad: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Jali Baris</Label>
                        <Input
                          type="number"
                          min="0"
                          value={row.jaliBaris}
                          onChange={(e) =>
                            handleChangeTasmi(idx, { jaliBaris: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Jali {'>'}1 Kalimat</Label>
                        <Input
                          type="number"
                          min="0"
                          value={row.jaliLebihSatuKalimat}
                          onChange={(e) =>
                            handleChangeTasmi(idx, {
                              jaliLebihSatuKalimat: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Catatan</Label>
                      <Textarea
                        value={row.note || ''}
                        onChange={(e) => handleChangeTasmi(idx, { note: e.target.value })}
                        placeholder="Catatan untuk surah ini..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">
                  Rata-rata Tasmi: {tasmiAverage.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {/* MUNAQASYAH Section */}
          {result.stage === MunaqasyahStage.MUNAQASYAH && (
            <div className="space-y-3">
              <h3 className="font-semibold">Penilaian Munaqasyah</h3>
              <div className="space-y-2">
                {munaqasyahRows.map((row, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="font-medium">Pertanyaan {row.questionNo}</Label>
                      <Badge variant="outline">Nilai: {calcMunaRowPercent(row).toFixed(1)}%</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Khofi Awal Ayat</Label>
                        <Input
                          type="number"
                          min="0"
                          value={row.khofiAwalAyat}
                          onChange={(e) =>
                            handleChangeMuna(idx, { khofiAwalAyat: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Khofi Makhroj</Label>
                        <Input
                          type="number"
                          min="0"
                          value={row.khofiMakhroj}
                          onChange={(e) =>
                            handleChangeMuna(idx, { khofiMakhroj: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Khofi Tajwid/Mad</Label>
                        <Input
                          type="number"
                          min="0"
                          value={row.khofiTajwidMad}
                          onChange={(e) =>
                            handleChangeMuna(idx, { khofiTajwidMad: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Jali Baris</Label>
                        <Input
                          type="number"
                          min="0"
                          value={row.jaliBaris}
                          onChange={(e) =>
                            handleChangeMuna(idx, { jaliBaris: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Jali {'>'}1 Kalimat</Label>
                        <Input
                          type="number"
                          min="0"
                          value={row.jaliLebihSatuKalimat}
                          onChange={(e) =>
                            handleChangeMuna(idx, {
                              jaliLebihSatuKalimat: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Catatan</Label>
                      <Textarea
                        value={row.note || ''}
                        onChange={(e) => handleChangeMuna(idx, { note: e.target.value })}
                        placeholder="Catatan untuk pertanyaan ini..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium text-green-900">
                  Rata-rata Munaqasyah: {munaAverage.toFixed(1)}%
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
