'use client';

import { useEffect, useState } from 'react';
import { SubmissionHistoryTable } from '@/components/teacher/submission-history/submission-history-table';

type Submission = {
  id: string;
  tanggal: string;
  jenisSetoran: string;
  juz: number;
  surahId: number;
  surah: {
    namaSurah: string;
  };
  wafaId: number;
  wafa: {
    namaBuku: string;
  };
  ayatMulai: number;
  ayatSelesai: number;
  halamanMulai: number;
  halamanSelesai: number;
  status: string;
  adab: string;
  catatan: string;
  siswa: {
    nis: string;
    user: {
      namaLengkap: string;
    };
  };
  kelompok: {
    namaKelompok: string;
    kelas: {
      namaKelas: string;
      tahunAjaran: string;
    };
  };
};

export function SubmissionHistoryManagement() {
  const [data, setData] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch('/api/submission');
        const redData = await res.json();
        if (redData.success) {
          setData(redData.data);
        } else {
          console.error(redData.error);
        }
      } catch (error) {
        console.error('Gagal memuat data setoran', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  if (loading) return <p>Loading...</p>;

  return <SubmissionHistoryTable data={data} title="Riwayat Setoran Siswa" />;
}
