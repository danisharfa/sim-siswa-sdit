'use client';

import { useEffect, useState } from 'react';
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

interface StudentRequest {
  requestId: string;
  scheduleId: string;
  batch: MunaqasyahBatch;
  stage: MunaqasyahStage;
  juz?: { name: string };
  student: {
    nis: string;
    user: { fullName: string };
  };
  result?: {
    passed: boolean;
    avarageScore: number;
    grade: string;
    tasmi?: {
      tajwid: number;
      kelancaran: number;
      adab: number;
      note?: string;
      totalScore: number;
    };
    munaqasyah?: {
      tajwid: number;
      kelancaran: number;
      adab?: number;
      note?: string;
      totalScore: number;
    };
  } | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AssessmentForm({ onSaved }: { onSaved: () => void }) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<StudentRequest | null>(null);

  // Score states based on stage
  const [tasmiScores, setTasmiScores] = useState({
    tajwid: '',
    kelancaran: '',
    adab: '',
    note: '',
  });

  const [munaqasyahScores, setMunaqasyahScores] = useState({
    tajwid: '',
    kelancaran: '',
    adab: '',
    note: '',
  });

  const { data: schedules } = useSWR('/api/teacher/munaqasyah/schedule/available', fetcher);
  const { data: studentsResponse, mutate } = useSWR(
    selectedScheduleId ? `/api/teacher/munaqasyah/result/schedule/${selectedScheduleId}` : null,
    fetcher
  );

  const students: StudentRequest[] | undefined = studentsResponse?.data;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId || !selectedRequestId || !selectedRequest) {
      toast.error('Harap lengkapi semua data');
      return;
    }

    // Validate scores based on stage
    if (selectedRequest.stage === MunaqasyahStage.TASMI) {
      if (!tasmiScores.tajwid || !tasmiScores.kelancaran || !tasmiScores.adab) {
        toast.error('Harap lengkapi semua nilai Tasmi');
        return;
      }
    } else {
      if (!munaqasyahScores.tajwid || !munaqasyahScores.kelancaran || !munaqasyahScores.adab) {
        toast.error('Harap lengkapi semua nilai Munaqasyah');
        return;
      }
    }

    const requestData = {
      scheduleId: selectedScheduleId,
      requestId: selectedRequestId,
      stage: selectedRequest.stage,
      ...(selectedRequest.stage === MunaqasyahStage.TASMI && {
        tasmi: {
          tajwid: Number(tasmiScores.tajwid),
          kelancaran: Number(tasmiScores.kelancaran),
          adab: Number(tasmiScores.adab),
          note: tasmiScores.note,
        },
      }),
      ...(selectedRequest.stage === MunaqasyahStage.MUNAQASYAH && {
        munaqasyah: {
          tajwid: Number(munaqasyahScores.tajwid),
          kelancaran: Number(munaqasyahScores.kelancaran),
          adab: Number(munaqasyahScores.adab),
          note: munaqasyahScores.note,
        },
      }),
    };

    const res = await fetch('/api/teacher/munaqasyah/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    const json = await res.json();
    if (json.success) {
      toast.success(json.message || 'Hasil munaqasyah berhasil disimpan');
      resetForm();
      onSaved();
      mutate();
    } else {
      toast.error(json.message || 'Gagal menyimpan hasil');
    }
  };

  const resetForm = () => {
    setSelectedRequestId(null);
    setSelectedRequest(null);
    setTasmiScores({ tajwid: '', kelancaran: '', adab: '', note: '' });
    setMunaqasyahScores({ tajwid: '', kelancaran: '', adab: '', note: '' });
  };

  useEffect(() => {
    resetForm();
  }, [selectedScheduleId]);

  useEffect(() => {
    if (selectedRequestId && students) {
      const request = students.find((s) => s.requestId === selectedRequestId);
      setSelectedRequest(request || null);
    }
  }, [selectedRequestId, students]);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Form Penilaian Munaqasyah</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-2 block">Pilih Jadwal Ujian</Label>
            <Select onValueChange={setSelectedScheduleId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih sesi munaqasyah" />
              </SelectTrigger>
              <SelectContent>
                {schedules?.data?.map((s: MunaqasyahSchedule) => (
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

          {selectedScheduleId && students && (
            <>
              <div>
                <Label className="mb-2 block">Pilih Siswa</Label>
                <Select onValueChange={setSelectedRequestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih siswa" />
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
                    <div className="space-y-4">
                      <h4 className="font-medium">Penilaian Tasmi</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="mb-2 block">Tajwid (0-100)</Label>
                          <Input
                            type="number"
                            value={tasmiScores.tajwid}
                            min={0}
                            max={100}
                            onChange={(e) =>
                              setTasmiScores((prev) => ({ ...prev, tajwid: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Kelancaran (0-100)</Label>
                          <Input
                            type="number"
                            value={tasmiScores.kelancaran}
                            min={0}
                            max={100}
                            onChange={(e) =>
                              setTasmiScores((prev) => ({ ...prev, kelancaran: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Adab (0-100)</Label>
                          <Input
                            type="number"
                            value={tasmiScores.adab}
                            min={0}
                            max={100}
                            onChange={(e) =>
                              setTasmiScores((prev) => ({ ...prev, adab: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block">Catatan Tasmi</Label>
                        <Textarea
                          value={tasmiScores.note}
                          onChange={(e) =>
                            setTasmiScores((prev) => ({ ...prev, note: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-medium">Penilaian Munaqasyah</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Tajwid (0-100)</Label>
                          <Input
                            type="number"
                            value={munaqasyahScores.tajwid}
                            min={0}
                            max={100}
                            onChange={(e) =>
                              setMunaqasyahScores((prev) => ({ ...prev, tajwid: e.target.value }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Kelancaran (0-100)</Label>
                          <Input
                            type="number"
                            value={munaqasyahScores.kelancaran}
                            min={0}
                            max={100}
                            onChange={(e) =>
                              setMunaqasyahScores((prev) => ({
                                ...prev,
                                kelancaran: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Adab (0-100)</Label>
                          <Input
                            type="number"
                            value={munaqasyahScores.adab}
                            min={0}
                            max={100}
                            onChange={(e) =>
                              setMunaqasyahScores((prev) => ({ ...prev, adab: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block">Catatan Munaqasyah</Label>
                        <Textarea
                          value={munaqasyahScores.note}
                          onChange={(e) =>
                            setMunaqasyahScores((prev) => ({ ...prev, note: e.target.value }))
                          }
                        />
                      </div>
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
