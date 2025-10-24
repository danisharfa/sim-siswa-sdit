'use client';

import type { TashihResult } from './TashihResultTable';
import { Table } from '@tanstack/react-table';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TashihType } from '@prisma/client';


interface Props {
  table: Table<TashihResult>;
  studentName?: string;
  studentNis?: string;
  academicYear?: string;
}

export function ExportToPDFButton({ table, studentName, studentNis, academicYear }: Props) {
  const handleExport = () => {
    const filteredRows = table.getFilteredRowModel().rows;

    if (filteredRows.length === 0) {
      toast('Tidak ada data untuk diekspor.');
      return;
    }

    // Format Data untuk Tabel
    const formattedData = filteredRows.map((row, index) => {
      const d = row.original;

      const formattedDate = new Date(d.tashihSchedule.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const sessionInfo = `${d.tashihSchedule.sessionName}\n${d.tashihSchedule.startTime} - ${d.tashihSchedule.endTime}\n${d.tashihSchedule.location}`;

      const tashihType = d.tashihRequest.tashihType.replaceAll('_', ' ');

      const material =
        d.tashihRequest.tashihType === TashihType.ALQURAN
          ? `${d.tashihRequest.surah?.name ?? '-'} (${d.tashihRequest.juz?.name ?? '-'})`
          : `${d.tashihRequest.wafa?.name ?? '-'} (Hal ${d.tashihRequest.startPage ?? '-'}${
              d.tashihRequest.endPage ? `–${d.tashihRequest.endPage}` : ''
            })`;

      const result = d.passed ? 'Lulus' : 'Tidak Lulus';
      const notes = d.notes || '-';

      return [
        index + 1, // No
        formattedDate,
        sessionInfo,
        tashihType,
        material,
        result,
        notes,
      ];
    });

    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Header Section
    // Judul utama
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SDIT ULUL ALBAB MATARAM', doc.internal.pageSize.width / 2, 20, { align: 'center' });

    // Sub judul
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('LAPORAN HASIL TASHIH SISWA', doc.internal.pageSize.width / 2, 28, {
      align: 'center',
    });

    // Info siswa
    if (studentName || studentNis) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Nama: ${studentName || '-'}`, 14, 40);
      doc.text(`NIS: ${studentNis || '-'}`, 14, 48);
    }

    // Tahun ajaran
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    if (studentName || studentNis) {
      doc.text(`Tahun Ajaran: ${academicYear || '-'}`, 14, 56);
    } else {
      doc.text(`Tahun Ajaran: ${academicYear || '-'}`, doc.internal.pageSize.width / 2, 36, {
        align: 'center',
      });
    }

    // Informasi tanggal cetak
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const yPos = studentName || studentNis ? 66 : 46;
    doc.text(`Dicetak pada: ${currentDate}`, 14, yPos);
    doc.text(`Total Data: ${filteredRows.length} hasil tashih`, 14, yPos + 6);

    // Garis pemisah
    doc.setLineWidth(0.5);
    const lineY = yPos + 10;
    doc.line(14, lineY, doc.internal.pageSize.width - 14, lineY);

    // Table Section
    autoTable(doc, {
      head: [
        ['No', 'Tanggal', 'Sesi & Lokasi', 'Jenis Tashih', 'Materi', 'Hasil', 'Catatan'],
      ],
      body: formattedData,
      startY: lineY + 8,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // No
        1: { halign: 'center', cellWidth: 45 }, // Tanggal
        2: { halign: 'center', cellWidth: 45 }, // Sesi & Lokasi
        3: { halign: 'center', cellWidth: 30 }, // Jenis Tashih
        4: { halign: 'center', cellWidth: 50 }, // Materi
        5: { halign: 'center', cellWidth: 20 }, // Hasil
        6: { halign: 'center', cellWidth: 50 }, // Catatan
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: lineY + 8, left: 14, right: 14, bottom: 20 },
      tableWidth: 'wrap',
      didDrawPage: (data) => {
        const pageNumber = data.pageNumber;
        const totalPages = (
          doc as unknown as { internal: { getNumberOfPages: () => number } }
        ).internal.getNumberOfPages();

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Halaman ${pageNumber} dari ${totalPages}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );

        doc.setLineWidth(0.3);
        doc.line(
          14,
          doc.internal.pageSize.height - 15,
          doc.internal.pageSize.width - 14,
          doc.internal.pageSize.height - 15
        );
      },
    });

    // Save file
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `laporan-hasil-tashih-siswa-${studentNis || 'unknown'}-${timestamp}.pdf`;

    doc.save(filename);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download />
      Export PDF
    </Button>
  );
}
