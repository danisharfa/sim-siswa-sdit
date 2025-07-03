'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Table } from '@tanstack/react-table';
import { Submission } from './SubmissionTable';

interface Props {
  table: Table<Submission>;
}

export function ExportToPDFButton({ table }: Props) {
  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows;
    if (rows.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const data = rows.map((row) => {
      const d = row.original;
      const tanggal = new Date(d.date).toLocaleDateString('id-ID');
      const materi =
        d.submissionType === 'TAHSIN_WAFA'
          ? `${d.wafa?.name ?? '-'} (${d.startPage ?? '-'}-${d.endPage ?? '-'})`
          : `${d.surah?.name ?? '-'} (${d.startVerse ?? '-'}-${d.endVerse ?? '-'})`;
      return [
        tanggal,
        d.submissionType.replaceAll('_', ' '),
        materi,
        d.submissionStatus.replaceAll('_', ' '),
        d.adab.replaceAll('_', ' '),
        d.note?.trim() || '-',
      ];
    });

    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text('Riwayat Setoran Hafalan Saya', 14, 14);

    autoTable(doc, {
      head: [['Tanggal', 'Jenis Setoran', 'Materi', 'Status', 'Adab', 'Catatan']],
      body: data,
      startY: 20,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 119, 255] },
    });

    doc.save('riwayat-setoran.pdf');
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="mr-2" />
      Cetak
    </Button>
  );
}
