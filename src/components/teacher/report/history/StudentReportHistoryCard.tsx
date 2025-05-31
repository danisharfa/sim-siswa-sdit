'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { StudentReportHistoryPdf } from '@/components/teacher/report/history/StudentReportHistoryPdf';
import type { StudentReportHistoryData } from '@/lib/data/teacher/report-history';

export function StudentReportHistoryCard({ data }: { data: StudentReportHistoryData }) {
  const {
    fullName,
    nis,
    nisn,
    address,
    className,
    semester,
    academicYear,
    teacherName,
    coordinatorName,
    tahsin,
    tahsinSummary,
    tahfidz,
    tahfidzSummary,
  } = data;

  console.log('Report data received:', {
    teacherName: data.teacherName,
    coordinatorName: data.coordinatorName,
    fullData: data,
  });

  // Helper functions
  const numberToRoman = (num: number): string => {
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return roman[num - 1] ?? num.toString();
  };

  const semesterToLabel = (s: typeof semester): string => {
    return s === 'GANJIL' ? 'I (Satu)' : 'II (Dua)';
  };

  // Format class label
  const [classNumberRaw, classNameRaw] = className.split(' ');
  const classRoman = numberToRoman(parseInt(classNumberRaw));
  const classLabel = `${classRoman} - ${classNameRaw}`;
  const semesterLabel = semesterToLabel(semester);

  return (
    <Card className="p-4 space-y-4">
      <CardContent className="space-y-3 text-sm">
        <div>
          <strong>Nama Peserta Didik:</strong> {fullName}
          <br />
          <strong>NISN / NIS:</strong> {nisn} / {nis}
          <br />
          <strong>Kelas / Semester:</strong> {classLabel} / {semesterLabel}
          <br />
          <strong>Tahun Ajaran:</strong> {academicYear}
          <br />
          <strong>Nama Sekolah:</strong> SDIT Ulul Albab Mataram
          <br />
          <strong>Alamat Siswa:</strong> {address || '-'}
        </div>

        <hr className="my-2" />

        <div>
          <strong>A. Evaluasi Tahsin</strong>
          <ul className="list-disc pl-5">
            {tahsin.map((s, i) => (
              <li key={i}>
                {s.topic} - {s.scoreNumeric} ({s.scoreLetter}): {s.description}
              </li>
            ))}
          </ul>
          <p>
            <strong>Rata-rata:</strong> {tahsinSummary?.averageScore?.toFixed(1) ?? '-'} <br />
            <strong>Bacaan Terakhir:</strong> {tahsinSummary?.lastMaterial ?? '-'}
          </p>
        </div>

        <div>
          <strong>B. Evaluasi Tahfidz</strong>
          <ul className="list-disc pl-5">
            {tahfidz.map((s, i) => (
              <li key={i}>
                {s.surahName} - {s.scoreNumeric} ({s.scoreLetter}): {s.description}
              </li>
            ))}
          </ul>
          <p>
            <strong>Rata-rata:</strong> {tahfidzSummary?.averageScore?.toFixed(1) ?? '-'}
          </p>
        </div>

        <div>
          <strong>Guru Pembimbing:</strong> {teacherName}
          <br />
          <strong>Koordinator:</strong> {coordinatorName}
        </div>

        <PDFDownloadLink
          document={<StudentReportHistoryPdf data={data} />}
          fileName={`Rapot_${fullName}.pdf`}
        >
          {({ loading }) =>
            loading ? <Button disabled>Loading PDF...</Button> : <Button>Download Rapot PDF</Button>
          }
        </PDFDownloadLink>
      </CardContent>
    </Card>
  );
}
