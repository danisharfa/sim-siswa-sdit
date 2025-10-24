'use client';

import { Table } from '@tanstack/react-table';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { MunaqasyahBatch, MunaqasyahStage } from '@prisma/client';
import type { MunaqasyahSchedule } from './MunaqasyahScheduleTable';

interface Props {
  table: Table<MunaqasyahSchedule>;
  academicYear?: string;
}

export function ExportToPDFButton({ table, academicYear }: Props) {
  const batchLabels: Record<MunaqasyahBatch, string> = {
    [MunaqasyahBatch.TAHAP_1]: 'Tahap 1',
    [MunaqasyahBatch.TAHAP_2]: 'Tahap 2',
    [MunaqasyahBatch.TAHAP_3]: 'Tahap 3',
    [MunaqasyahBatch.TAHAP_4]: 'Tahap 4',
  };

  const stageLabels: Record<MunaqasyahStage, string> = {
    [MunaqasyahStage.TASMI]: 'Tasmi',
    [MunaqasyahStage.MUNAQASYAH]: 'Munaqasyah',
  };

  const handleExport = () => {
    const filteredRows = table.getFilteredRowModel().rows;

    if (filteredRows.length === 0) {
      toast('Tidak ada data untuk diekspor.');
      return;
    }

    // Format Data untuk Tabel
    const formattedData: string[][] = [];
    let index = 1;

    filteredRows.forEach((row) => {
      const schedule = row.original;

      const formattedDate = new Date(schedule.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const sessionInfo = `${schedule.sessionName}\n${schedule.startTime} - ${schedule.endTime}\n${schedule.location}`;

      // Process each student in the schedule
      schedule.scheduleRequests.forEach((s) => {
        const r = s.request;

        const studentInfo = `${r.student.user.fullName}\n(${r.student.nis})`;
        const groupInfo = `${r.group.name}\n${r.group.classroom.name}`;
        const teacherName = r.teacher.user.fullName;
        const batch = batchLabels[r.batch];
        const stage = stageLabels[r.stage];
        const juz = r.juz?.name ?? '-';
        const examiner = schedule.examiner?.user?.fullName ?? "Koordinator Al-Qur'an";

        formattedData.push([
          index.toString(),
          formattedDate,
          sessionInfo,
          studentInfo,
          groupInfo,
          teacherName,
          batch,
          stage,
          juz,
          examiner,
        ]);

        index++;
      });
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
    doc.text('LAPORAN JADWAL MUNAQASYAH SISWA', doc.internal.pageSize.width / 2, 28, {
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
    doc.text(`Total Data: ${formattedData.length} jadwal`, 14, yPos + 6);

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
          'Batch',
          'Tahap',
          'Juz',
          'Penguji',
        ],
      ],
      body: formattedData,
      startY: lineY + 8,
      styles: {
        fontSize: 6,
        cellPadding: 1.5,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 }, // No
        1: { halign: 'center', cellWidth: 30 }, // Tanggal
        2: { halign: 'center', cellWidth: 35 }, // Sesi & Lokasi
        3: { halign: 'center', cellWidth: 30 }, // Siswa
        4: { halign: 'center', cellWidth: 25 }, // Kelompok
        5: { halign: 'center', cellWidth: 25 }, // Guru Pembimbing
        6: { halign: 'center', cellWidth: 20 }, // Batch
        7: { halign: 'center', cellWidth: 20 }, // Tahap
        8: { halign: 'center', cellWidth: 15 }, // Juz
        9: { halign: 'center', cellWidth: 30 }, // Penguji
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
    const filename = `laporan-jadwal-munaqasyah-${timestamp}.pdf`;

    doc.save(filename);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download />
      Export PDF
    </Button>
  );
}
