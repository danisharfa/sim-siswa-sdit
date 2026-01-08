'use client';

import { Table } from '@tanstack/react-table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TashihType } from '@prisma/client';
import type { TashihResult } from './TashihResultTable';
import { toast } from 'sonner';

interface Props {
  table: Table<TashihResult>;
  academicYear?: string;
}

export function ExportToPDFButton({ table, academicYear }: Props) {
  const handleExport = () => {
    const filteredRows = table.getFilteredRowModel().rows;

    if (filteredRows.length === 0) {
      toast('Tidak ada data untuk diekspor.');
      return;
    }

    // Format Data untuk Tabel
    const formattedData: string[][] = [];

    filteredRows.forEach((row, index) => {
      const result = row.original;

      const formattedDate = new Date(result.tashihSchedule.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const sessionInfo = `${result.tashihSchedule.sessionName}\n${result.tashihSchedule.startTime} - ${result.tashihSchedule.endTime}\n${result.tashihSchedule.location}`;

      const studentInfo = `${result.tashihRequest.student.user.fullName}\n(${result.tashihRequest.student.nis})`;
      const groupInfo = `${result.tashihRequest.group.name}\n${result.tashihRequest.group.classroom.name}`;
      const teacherName = result.tashihRequest.teacher.user.fullName;

      const material = (() => {
        const r = result.tashihRequest;
        if (r.tashihType === TashihType.ALQURAN) {
          return `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`;
        }
        if (r.tashihType === TashihType.WAFA) {
          const label =
            r.startPage && r.endPage
              ? r.startPage === r.endPage
                ? `Hal ${r.startPage}`
                : `Hal ${r.startPage}-${r.endPage}`
              : '-';
          return `${r.wafa?.name ?? '-'} (${label})`;
        }
        return '-';
      })();

      const status = result.passed ? 'Lulus' : 'Tidak Lulus';

      formattedData.push([
        (index + 1).toString(),
        formattedDate,
        sessionInfo,
        studentInfo,
        groupInfo,
        teacherName,
        material,
        status,
      ]);
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

    // Tahun ajaran
    if (academicYear) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Tahun Ajaran: ${academicYear}`, doc.internal.pageSize.width / 2, 36, {
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
    const yPos = academicYear ? 46 : 38;
    doc.text(`Dicetak pada: ${currentDate}`, 14, yPos);
    doc.text(`Total Data: ${formattedData.length} hasil`, 14, yPos + 6);

    // Garis pemisah
    doc.setLineWidth(0.5);
    const lineY = yPos + 10;
    doc.line(14, lineY, doc.internal.pageSize.width - 14, lineY);

    // Table Section
    autoTable(doc, {
      head: [
        [
          'No',
          'Tanggal',
          'Sesi & Lokasi',
          'Siswa',
          'Kelompok',
          'Guru Pembimbing',
          'Materi',
          'Status',
        ],
      ],
      body: formattedData,
      startY: lineY + 8,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 }, // No
        1: { halign: 'center', cellWidth: 30 }, // Tanggal
        2: { halign: 'center', cellWidth: 35 }, // Sesi & Lokasi
        3: { halign: 'center', cellWidth: 30 }, // Siswa
        4: { halign: 'center', cellWidth: 25 }, // Kelompok
        5: { halign: 'center', cellWidth: 25 }, // Guru Pembimbing
        6: { halign: 'center', cellWidth: 40 }, // Materi
        7: { halign: 'center', cellWidth: 20 }, // Status
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
    const filename = `laporan-hasil-tashih-${timestamp}.pdf`;

    doc.save(filename);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download />
      Export PDF
    </Button>
  );
}
