'use client';

import type { TashihRequest } from './TashihRequestTable';
import { Table } from '@tanstack/react-table';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TashihType } from '@prisma/client';

interface Props {
  table: Table<TashihRequest>;
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
    const formattedData = filteredRows.map((row, index) => {
      const d = row.original;

      const formattedDate = new Date(d.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const studentInfo = `${d.student.user.fullName}\n(${d.student.nis})`;

      const groupInfo = `${d.group.name}\n${d.group.classroom.name}`;

      const teacherName = d.teacher.user.fullName;

      const tashihType = d.tashihType === TashihType.ALQURAN ? "Al-Qur'an" : 'Wafa';

      const material = (() => {
        if (d.tashihType === TashihType.ALQURAN) {
          return `${d.surah?.name ?? '-'} (${d.juz?.name ?? '-'})`;
        }
        if (d.tashihType === TashihType.WAFA) {
          const label =
            d.startPage && d.endPage
              ? d.startPage === d.endPage
                ? `Hal ${d.startPage}`
                : `Hal ${d.startPage}-${d.endPage}`
              : '-';
          return `${d.wafa?.name ?? '-'} (${label})`;
        }
        return '-';
      })();

      const status = d.status;

      const notes = d.notes || '-';

      return [
        index + 1, // No
        formattedDate,
        studentInfo,
        groupInfo,
        teacherName,
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
    doc.text('LAPORAN PERMINTAAN TASHIH SISWA', doc.internal.pageSize.width / 2, 28, {
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
    doc.text(`Total Data: ${filteredRows.length} permintaan`, 14, yPos + 6);

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
          'Siswa',
          'Kelompok',
          'Guru Pembimbing',
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
        1: { halign: 'center', cellWidth: 25 }, // Tanggal
        2: { halign: 'center', cellWidth: 35 }, // Siswa
        3: { halign: 'center', cellWidth: 30 }, // Kelompok
        4: { halign: 'center', cellWidth: 30 }, // Guru Pembimbing
        5: { halign: 'center', cellWidth: 25 }, // Jenis Tashih
        6: { halign: 'center', cellWidth: 40 }, // Materi
        7: { halign: 'center', cellWidth: 25 }, // Status
        8: { halign: 'center', cellWidth: 45 }, // Catatan
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
    const filename = `laporan-permintaan-tashih-${timestamp}.pdf`;

    doc.save(filename);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download />
      Export PDF
    </Button>
  );
}
