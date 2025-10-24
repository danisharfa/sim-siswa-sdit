'use client';

import type { MunaqasyahResult } from './MunaqasyahResultTable';
import { Table } from '@tanstack/react-table';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface Props {
  table: Table<MunaqasyahResult>;
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
      const d = row.original as MunaqasyahResult;

      const formattedDate = new Date(d.schedule.date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const sessionInfo = `${d.schedule.sessionName}\n${d.schedule.startTime} - ${d.schedule.endTime}\n${d.schedule.location}`;
      const batch = d.request.batch.replaceAll('_', ' ');
      const stage = d.request.stage.replaceAll('_', ' ');
      const juz = d.request.juz.name;
      const examiner = d.schedule.examiner
        ? d.schedule.examiner.user.fullName
        : "Koordinator Al-Qur'an";
      const score = `${d.score}\n(${d.grade})`;
      const finalScore = `${d.finalResult?.finalScore?.toFixed(1) || '-'}\n(${d.finalResult?.finalGrade || '-'})`;
      const status = d.finalResult?.passed ? 'Lulus' : 'Belum Lulus';

      return [
        index + 1, // No
        formattedDate,
        sessionInfo,
        batch,
        stage,
        juz,
        examiner,
        score,
        status,
        finalScore,
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
    doc.text('LAPORAN HASIL MUNAQASYAH SISWA', doc.internal.pageSize.width / 2, 28, {
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
        1: { halign: 'center', cellWidth: 30 }, // Tanggal
        2: { halign: 'center', cellWidth: 35 }, // Sesi & Lokasi
        3: { halign: 'center', cellWidth: 20 }, // Batch
        4: { halign: 'center', cellWidth: 30 }, // Tahap
        5: { halign: 'center', cellWidth: 15 }, // Juz
        6: { halign: 'center', cellWidth: 35 }, // Penguji
        7: { halign: 'center', cellWidth: 30 }, // Nilai
        8: { halign: 'center', cellWidth: 25 }, // Status
        9: { halign: 'center', cellWidth: 30 }, // Nilai Final
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
    const filename = `laporan-hasil-munaqasyah-siswa-${studentNis || 'unknown'}-${timestamp}.pdf`;

    doc.save(filename);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download />
      Export PDF
    </Button>
  );
}
