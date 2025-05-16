'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Table } from '@tanstack/react-table';
import { Submission } from '@/components/teacher/submission/history/table';

interface Props {
  table: Table<Submission>;
}

export function ExportToPDFButton({ table }: Props) {
  const handleExport = () => {
    const filteredRows = table.getFilteredRowModel().rows;

    if (filteredRows.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const formattedData = filteredRows.map((row) => {
      const d = row.original;

      const formattedDate = new Date(d.date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const materi =
        d.submissionType === 'TAHSIN_WAFA'
          ? `${d.wafa?.name ?? '-'} (${d.startPage ?? '-'}-${d.endPage ?? '-'})`
          : `${d.surah?.name ?? '-'} (${d.startVerse ?? '-'}-${d.endVerse ?? '-'})`;

      return [
        formattedDate,
        d.student.user.fullName,
        d.student.nis,
        `${d.group.name} - ${d.group.classroom.name}`,
        `${d.group.classroom.academicYear} ${d.group.classroom.semester}`,
        d.submissionType.replaceAll('_', ' '),
        materi,
        d.submissionStatus.replaceAll('_', ' '),
        d.adab.replaceAll('_', ' '),
        d.note?.trim() || '-',
      ];
    });

    const doc = new jsPDF('landscape');
    doc.setFontSize(12);
    doc.text('Riwayat Setoran Hafalan Siswa', 14, 14);

    autoTable(doc, {
      head: [
        [
          'Tanggal',
          'Nama Siswa',
          'NIS',
          'Kelompok & Kelas',
          'Tahun Ajaran',
          'Jenis Setoran',
          'Materi',
          'Status',
          'Adab',
          'Catatan',
        ],
      ],
      body: formattedData,
      startY: 20,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 119, 255] }, // warna biru
    });

    doc.save('riwayat-setoran.pdf');
  };

  return (
    <Button variant="outline" onClick={handleExport} className="ml-auto flex gap-2">
      <Download className="w-4 h-4" />
      Export PDF
    </Button>
  );
}
