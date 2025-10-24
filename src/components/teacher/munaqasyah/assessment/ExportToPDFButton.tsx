'use client';

import type { MunaqasyahResult } from '@/components/teacher/munaqasyah/assessment/MunaqasyahResultTable';
import { Table } from '@tanstack/react-table';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { MunaqasyahBatch, MunaqasyahStage } from '@prisma/client';

interface Props {
  table: Table<MunaqasyahResult>;
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
      const result = row.original;

      const formattedDate = new Date(result.schedule.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const sessionInfo = `${result.schedule.sessionName}\n${result.schedule.startTime} - ${result.schedule.endTime}\n${result.schedule.location}`;

      const studentInfo = `${result.student.user.fullName}\n(${result.student.nis})`;

      const groupInfo = `${result.groupName}\n${result.classroomName}`;

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

      const gradeLabels: Record<string, string> = {
        MUMTAZ: 'Mumtaz',
        JAYYID_JIDDAN: 'Jayyid Jiddan',
        JAYYID: 'Jayyid',
        TIDAK_LULUS: 'Tidak Lulus',
      };

      const batchInfo = batchLabels[result.batch] || result.batch;
      const stageInfo = stageLabels[result.stage] || result.stage;
      const juzInfo = result.juz.name;
      const scoreInfo = `${result.score.toFixed(1)}\n(${
        gradeLabels[result.grade] || result.grade
      })`;
      const statusInfo = result.passed ? 'Lulus' : 'Tidak Lulus';

      const finalScoreInfo = result.finalResult
        ? `${result.finalResult.finalScore.toFixed(1)}\n(${
            gradeLabels[result.finalResult.finalGrade] || result.finalResult.finalGrade
          })`
        : 'Belum ada hasil final';

      return [
        index + 1, // No
        formattedDate,
        sessionInfo,
        studentInfo,
        groupInfo,
        batchInfo,
        stageInfo,
        juzInfo,
        scoreInfo,
        statusInfo,
        finalScoreInfo,
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
    doc.text('LAPORAN HASIL MUNAQASYAH SISWA BIMBINGAN', doc.internal.pageSize.width / 2, 28, {
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
          'Batch',
          'Tahapan',
          'Juz',
          'Nilai',
          'Status',
          'Nilai Final',
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
        5: { halign: 'center', cellWidth: 20 }, // Batch
        6: { halign: 'center', cellWidth: 20 }, // Tahapan
        7: { halign: 'center', cellWidth: 15 }, // Juz
        8: { halign: 'center', cellWidth: 25 }, // Nilai
        9: { halign: 'center', cellWidth: 20 }, // Status
        10: { halign: 'center', cellWidth: 25 }, // Nilai Final
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
    const filename = `laporan-hasil-munaqasyah-guru-${timestamp}.pdf`;

    doc.save(filename);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download />
      Export PDF
    </Button>
  );
}
