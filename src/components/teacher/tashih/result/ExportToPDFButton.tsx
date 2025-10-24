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
  teacherName?: string;
  academicYear?: string;
}

export function ExportToPDFButton({ table, teacherName, academicYear }: Props) {
  const handleExport = () => {
    const filteredRows = table.getFilteredRowModel().rows;

    if (filteredRows.length === 0) {
      toast('Tidak ada data untuk diekspor.');
      return;
    }

    // Format Data untuk Tabel
    const formattedData = filteredRows.map((row, index) => {
      const d = row.original;
      const r = d.tashihRequest;
      const s = d.tashihSchedule;

      const formattedDate = new Date(s.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const sessionInfo = `${s.sessionName}\n${s.startTime} - ${s.endTime}\n${s.location}`;

      const studentInfo = `${r.student.user.fullName}\n(${r.student.nis})`;

      const groupInfo = `${r.group.name}\n${r.group.classroom.name}`;

      const tashihType = r.tashihType.replaceAll('_', ' ');

      const material =
        r.tashihType === TashihType.ALQURAN
          ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
          : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${r.endPage ? `–${r.endPage}` : ''})`;

      const status = d.passed ? 'Lulus' : 'Tidak Lulus';

      const notes = d.notes || '-';

      return [
        index + 1, // No
        formattedDate,
        sessionInfo,
        studentInfo,
        groupInfo,
        tashihType,
        material,
        status,
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
    doc.text('LAPORAN HASIL TASHIH SISWA BIMBINGAN', doc.internal.pageSize.width / 2, 28, {
      align: 'center',
    });

    // Info guru
    if (teacherName) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Guru Pembimbing: ${teacherName}`, 14, 40);
    }

    // Tahun ajaran
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    if (teacherName) {
      doc.text(`Tahun Ajaran: ${academicYear || '-'}`, 14, 48);
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
    const yPos = teacherName ? 58 : 46;
    doc.text(`Dicetak pada: ${currentDate}`, 14, yPos);
    doc.text(`Total Data: ${filteredRows.length} hasil`, 14, yPos + 6);

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
          'Jenis Tashih',
          'Materi',
          'Status',
          'Catatan',
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
        1: { halign: 'center', cellWidth: 35 }, // Tanggal
        2: { halign: 'center', cellWidth: 35 }, // Sesi & Lokasi
        3: { halign: 'center', cellWidth: 35 }, // Siswa
        4: { halign: 'center', cellWidth: 30 }, // Kelompok
        5: { halign: 'center', cellWidth: 25 }, // Jenis Tashih
        6: { halign: 'center', cellWidth: 40 }, // Materi
        7: { halign: 'center', cellWidth: 20 }, // Status
        8: { halign: 'center', cellWidth: 40 }, // Catatan
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
    const filename = `laporan-hasil-tashih-guru-${timestamp}.pdf`;

    doc.save(filename);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download />
      Export PDF
    </Button>
  );
}
