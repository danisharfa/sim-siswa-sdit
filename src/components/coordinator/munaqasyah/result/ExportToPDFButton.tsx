'use client';

import { Table } from '@tanstack/react-table';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { MunaqasyahBatch, MunaqasyahStage } from '@prisma/client';
import type { MunaqasyahResult } from './MunaqasyahResultTable';

interface Props {
  table: Table<MunaqasyahResult>;
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

    filteredRows.forEach((row, index) => {
      const result = row.original;

      const formattedDate = new Date(result.schedule.date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const sessionInfo = `${result.schedule.sessionName}\n${result.schedule.startTime} - ${result.schedule.endTime}\n${result.schedule.location}`;
      const studentInfo = `${result.student.user.fullName}\n(${result.student.nis})`;
      const groupInfo = `${result.groupName}\n${result.classroomName}`;
      const batch = batchLabels[result.batch];
      const stage = stageLabels[result.stage];
      const juz = result.juz?.name || '-';
      const examiner = result.schedule.examiner?.user?.fullName ?? "Koordinator Al-Qur'an";

      // Calculate scores like in student version
      const score = `${result.score}\n(${result.grade})`;
      const finalScore = `${result.finalResult?.finalScore?.toFixed(1) || '-'}\n(${
        result.finalResult?.finalGrade || '-'
      })`;
      const status = result.finalResult?.passed ? 'Lulus' : 'Belum Lulus';

      formattedData.push([
        (index + 1).toString(), // No
        formattedDate, // Tanggal
        sessionInfo, // Sesi & Lokasi
        studentInfo, // Siswa (Nama + NIS)
        groupInfo, // Kelompok
        batch, // Batch
        stage, // Tahap
        juz, // Juz
        examiner, // Penguji
        score, // Nilai (Score + Grade)
        status, // Status
        finalScore, // Nilai Final
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
    doc.text('LAPORAN HASIL MUNAQASYAH SISWA', doc.internal.pageSize.width / 2, 28, {
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
          'Batch',
          'Tahap',
          'Juz',
          'Penguji',
          'Nilai',
          'Status',
          'Nilai Final',
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
        1: { halign: 'center', cellWidth: 20 }, // Tanggal
        2: { halign: 'center', cellWidth: 30 }, // Sesi & Lokasi
        3: { halign: 'center', cellWidth: 25 }, // Siswa
        4: { halign: 'center', cellWidth: 20 }, // Kelompok
        5: { halign: 'center', cellWidth: 15 }, // Batch
        6: { halign: 'center', cellWidth: 20 }, // Tahap
        7: { halign: 'center', cellWidth: 12 }, // Juz
        8: { halign: 'center', cellWidth: 25 }, // Penguji
        9: { halign: 'center', cellWidth: 20 }, // Nilai
        10: { halign: 'center', cellWidth: 18 }, // Status
        11: { halign: 'center', cellWidth: 20 }, // Nilai Final
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
    const filename = `laporan-hasil-munaqasyah-${timestamp}.pdf`;

    doc.save(filename);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download />
      Export PDF
    </Button>
  );
}
