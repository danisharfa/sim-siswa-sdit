'use client';

import type { HomeActivity } from '@/components/coordinator/home-activity/HomeActivityTable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Table } from '@tanstack/react-table';

interface Props {
  table: Table<HomeActivity>;
}

export function ExportToPDFButton({ table }: Props) {
  const handleExport = () => {
    const filteredRows = table.getFilteredRowModel().rows;

    if (filteredRows.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    // Ambil tahun ajaran dari data pertama untuk header
    const firstRow = filteredRows[0]?.original;
    const academicYear = firstRow
      ? `${firstRow.group.classroom.academicYear} ${firstRow.group.classroom.semester}`
      : '';

    const formattedData = filteredRows.map((row, index) => {
      const d = row.original;

      const formattedDate = new Date(d.date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const materi = `${d.surah.name}\nAyat ${d.startVerse} - ${d.endVerse}\n(${d.juz.name})`;

      const activityTypeText = d.activityType.replaceAll('_', ' ');

      return [
        index + 1, // No
        formattedDate,
        `${d.student.user.fullName}\n${d.student.nis}`,
        `${d.group.name}\n${d.group.classroom.name}`,
        activityTypeText,
        materi,
        d.note?.trim() || '-',
      ];
    });

    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Header dengan logo/kop sekolah
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SDIT ULUL ALBAB MATARAM', doc.internal.pageSize.width / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('LAPORAN AKTIVITAS RUMAH SISWA', doc.internal.pageSize.width / 2, 28, {
      align: 'center',
    });

    // Tahun ajaran
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Tahun Ajaran: ${academicYear}`, doc.internal.pageSize.width / 2, 36, {
      align: 'center',
    });

    // Informasi tanggal cetak
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Dicetak pada: ${currentDate}`, 14, 38);
    doc.text(`Total Data: ${filteredRows.length} aktivitas`, 14, 44);

    // Garis pemisah
    doc.setLineWidth(0.5);
    doc.line(14, 48, doc.internal.pageSize.width - 14, 48);

    autoTable(doc, {
      head: [['No', 'Tanggal', 'Siswa', 'Kelompok', 'Jenis\nAktivitas', 'Materi', 'Catatan']],
      body: formattedData,
      startY: 58,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [41, 128, 185], // Biru professional
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // No
        1: { halign: 'center', cellWidth: 30 }, // Tanggal
        2: { halign: 'center', cellWidth: 40 }, // Siswa
        3: { halign: 'center', cellWidth: 40 }, // Kelompok
        4: { halign: 'center', cellWidth: 30 }, // Jenis Aktivitas
        5: { halign: 'center', cellWidth: 50 }, // Materi
        6: { halign: 'center', cellWidth: 45 }, // Catatan
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245], // Abu-abu muda untuk baris ganjil
      },
      margin: { top: 58, left: 14, right: 14, bottom: 20 },
      didDrawPage: (data) => {
        // Footer dengan nomor halaman
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

    // Generate filename dengan timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `laporan-aktivitas-rumah-${timestamp}.pdf`;

    doc.save(filename);
  };

  return (
    <Button variant="outline" onClick={handleExport} className="">
      <Download />
      Export PDF
    </Button>
  );
}
