'use client';

import type { TashihSchedule } from '@/components/student/tashih/schedule/TashihScheduleTable';
import { Table } from '@tanstack/react-table';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TashihType } from '@prisma/client';

interface TashihRequestData {
  id: string;
  tashihType: TashihType;
  surah: { name: string } | null;
  juz: { name: string } | null;
  wafa: { name: string } | null;
  startPage: number | null;
  endPage: number | null;
  teacher: {
    user: { fullName: string };
  };
  group: {
    name: string;
    classroom: {
      name: string;
      academicYear: string;
      semester: string;
    };
  };
}

interface ScheduleData {
  tashihRequest: TashihRequestData;
}

interface Props {
  table: Table<TashihSchedule>;
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

      const formattedDate = new Date(d.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const sessionInfo = `${d.sessionName}\n${d.startTime} - ${d.endTime}\n${d.location}`;

      const tashihTypes = d.schedules
        .map((s: ScheduleData) => s.tashihRequest.tashihType.replaceAll('_', ' '))
        .join(', ');

      const materials = d.schedules
        .map((s: ScheduleData) => {
          const r = s.tashihRequest;
          return r.tashihType === TashihType.ALQURAN
            ? `${r.surah?.name ?? '-'} (${r.juz?.name ?? '-'})`
            : `${r.wafa?.name ?? '-'} (Hal ${r.startPage ?? '-'}${
                r.endPage ? `–${r.endPage}` : ''
              })`;
        })
        .join('\n');

      return [
        index + 1, // No
        formattedDate,
        sessionInfo,
        tashihTypes,
        materials,
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
    doc.text('LAPORAN JADWAL TASHIH SISWA', doc.internal.pageSize.width / 2, 28, {
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
    doc.text(`Total Data: ${filteredRows.length} jadwal`, 14, yPos + 6);

    // Garis pemisah
    doc.setLineWidth(0.5);
    const lineY = yPos + 10;
    doc.line(14, lineY, doc.internal.pageSize.width - 14, lineY);

    // Table Section
    autoTable(doc, {
      head: [['No', 'Tanggal', 'Sesi & Lokasi', 'Jenis Tashih', 'Materi']],
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
        1: { halign: 'center', cellWidth: 50 }, // Tanggal
        2: { halign: 'center', cellWidth: 55 }, // Sesi & Lokasi
        3: { halign: 'center', cellWidth: 35 }, // Jenis Tashih
        4: { halign: 'center', cellWidth: 95 }, // Materi
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
    const filename = `laporan-jadwal-tashih-siswa-${studentNis || 'unknown'}-${timestamp}.pdf`;

    doc.save(filename);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download />
      Export PDF
    </Button>
  );
}
