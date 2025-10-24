'use client';

import type { MunaqasyahSchedule } from '@/components/teacher/munaqasyah/schedule/MunaqasyahScheduleTable';
import { Table } from '@tanstack/react-table';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { MunaqasyahBatch, MunaqasyahStage } from '@prisma/client';

interface Props {
  table: Table<MunaqasyahSchedule>;
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
      const schedule = row.original;
      const request = schedule.scheduleRequests[0]?.request;

      if (!request) return [];

      const formattedDate = new Date(schedule.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const sessionInfo = `${schedule.sessionName}\n${schedule.startTime} - ${schedule.endTime}\n${schedule.location}`;

      const studentInfo = `${request.student.user.fullName}\n(${request.student.nis})`;

      const groupInfo = `${request.group.name}\n${request.group.classroom.name}`;

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

      const batchInfo = batchLabels[request.batch] || request.batch;
      const stageInfo = stageLabels[request.stage] || request.stage;
      const juzInfo = request.juz.name;
      const examinerInfo = schedule.examiner?.user?.fullName || "Koordinator Al-Qur'an";

      return [
        index + 1, // No
        formattedDate,
        sessionInfo,
        studentInfo,
        groupInfo,
        batchInfo,
        stageInfo,
        juzInfo,
        examinerInfo,
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
    doc.text('LAPORAN JADWAL MUNAQASYAH SISWA BIMBINGAN', doc.internal.pageSize.width / 2, 28, {
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
    doc.text(`Total Data: ${filteredRows.length} jadwal`, 14, yPos + 6);

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
          'Batch',
          'Tahapan',
          'Juz',
          'Penguji',
        ],
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
        0: { halign: 'center', cellWidth: 12 }, // No
        1: { halign: 'center', cellWidth: 40 }, // Tanggal
        2: { halign: 'center', cellWidth: 40 }, // Sesi & Lokasi
        3: { halign: 'center', cellWidth: 45 }, // Siswa
        4: { halign: 'center', cellWidth: 35 }, // Kelompok
        5: { halign: 'center', cellWidth: 25 }, // Batch
        6: { halign: 'center', cellWidth: 25 }, // Tahapan
        7: { halign: 'center', cellWidth: 20 }, // Juz
        8: { halign: 'center', cellWidth: 35 }, // Penguji
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
    const filename = `laporan-jadwal-munaqasyah-guru-${timestamp}.pdf`;

    doc.save(filename);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download />
      Export PDF
    </Button>
  );
}
