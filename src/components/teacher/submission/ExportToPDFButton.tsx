'use client';

import type { Submission } from '@/components/teacher/submission/SubmissionTable';
import { Table } from '@tanstack/react-table';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface Props {
  table: Table<Submission>;
}

export function ExportToPDFButton({ table }: Props) {
  const handleExport = () => {
    const filteredRows = table.getFilteredRowModel().rows;

    if (filteredRows.length === 0) {
      toast('Tidak ada data untuk diekspor.');
      return;
    }

    // Ambil tahun ajaran dari data pertama untuk header
    const firstRow = filteredRows[0]?.original;
    const academicYear = firstRow
      ? `${firstRow.group.classroom.academicYear} ${firstRow.group.classroom.semester}`
      : '';

    // Format Data untuk Tabel
    const formattedData = filteredRows.map((row, index) => {
      const d = row.original;

      const formattedDate = new Date(d.date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const materi =
        d.submissionType === 'TAHSIN_WAFA'
          ? `${d.wafa?.name ?? '-'}\nHal. ${d.startPage ?? '-'} - ${d.endPage ?? '-'}`
          : `${d.surah?.name ?? '-'}\nAyat ${d.startVerse ?? '-'} - ${d.endVerse ?? '-'}${
              d.juz?.name ? `\n(${d.juz.name})` : ''
            }`;

      const statusText = d.submissionStatus.replaceAll('_', ' ');
      const adabText = d.adab.replaceAll('_', ' ');
      const submissionTypeText = d.submissionType.replaceAll('_', ' ');

      return [
        index + 1, // No
        formattedDate,
        `${d.student.user.fullName}\n${d.student.nis}`,
        `${d.group.name}\n${d.group.classroom.name}`,
        submissionTypeText,
        materi,
        statusText,
        adabText,
        d.note?.trim() || '-',
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
    doc.text('LAPORAN SETORAN HAFALAN SISWA BIMBINGAN', doc.internal.pageSize.width / 2, 28, {
      align: 'center',
    });

    // Tahun ajaran
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Tahun Ajaran: ${academicYear}`, doc.internal.pageSize.width / 2, 36, {
      align: 'center',
    });

    // Informasi tanggal cetak dan user
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Dicetak pada: ${currentDate}`, 14, 38);
    doc.text(`Total Data: ${filteredRows.length} setoran`, 14, 44);

    // Garis pemisah
    doc.setLineWidth(0.5);
    doc.line(14, 48, doc.internal.pageSize.width - 14, 48);

    // Table Section
    autoTable(doc, {
      head: [
        [
          'No',
          'Tanggal',
          'Siswa',
          'Kelompok',
          'Jenis\nSetoran',
          'Materi',
          'Status',
          'Adab',
          'Catatan',
        ],
      ],
      body: formattedData,
      startY: 58,
      styles: {
        fontSize: 8, // Ukuran font dalam tabel
        cellPadding: 3, // Jarak dalam sel
        overflow: 'linebreak', // Text panjang akan dipotong ke baris baru
        halign: 'left', // Alignment horizontal default
        valign: 'middle', // Alignment vertical tengah
      },
      headStyles: {
        fillColor: [41, 128, 185], // Warna background biru (RGB)
        textColor: [255, 255, 255], // Text putih
        fontStyle: 'bold', // Font tebal
        fontSize: 9, // Ukuran font header
        halign: 'center', // Text rata tengah
        valign: 'middle', // Alignment vertical tengah
      },
      columnStyles: {
        // total cellWidth = 270
        0: { halign: 'center', cellWidth: 15 }, // No
        1: { halign: 'center', cellWidth: 30 }, // Tanggal
        2: { halign: 'center', cellWidth: 40 }, // Siswa
        3: { halign: 'center', cellWidth: 40 }, // Kelompok
        4: { halign: 'center', cellWidth: 20 }, // Jenis Setoran
        5: { halign: 'center', cellWidth: 45 }, // Materi
        6: { halign: 'center', cellWidth: 20 }, // Status
        7: { halign: 'center', cellWidth: 20 }, // Adab
        8: { halign: 'center', cellWidth: 40 }, // Catatan
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245], // Abu-abu muda untuk baris ganjil
      },
      margin: { top: 58, left: 14, right: 14, bottom: 20 },
      tableWidth: 'wrap',
      // Footer Section
      didDrawPage: (data) => {
        // Footer dengan nomor halaman
        const pageNumber = data.pageNumber;
        const totalPages = (
          doc as unknown as { internal: { getNumberOfPages: () => number } }
        ).internal.getNumberOfPages();

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        // Nomor halaman
        doc.text(
          `Halaman ${pageNumber} dari ${totalPages}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );

        // Garis footer
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
    const filename = `laporan-setoran-${timestamp}.pdf`;

    doc.save(filename);
  };

  return (
    <Button variant="outline" onClick={handleExport} className="">
      <Download />
      Export PDF
    </Button>
  );
}
