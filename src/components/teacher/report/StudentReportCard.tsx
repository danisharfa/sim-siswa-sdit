'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { StudentReportPdf } from '@/components/teacher/report/StudentReportPdf';
import type { StudentReportData } from '@/lib/data/teacher/report';

export function StudentReportCard({ data }: { data: StudentReportData }) {
  const {
    fullName,
    nis,
    nisn,
    address,
    className,
    academicYear,
    semester,
    teacherName,
    schoolInfo,
    tahsin,
    tahfidz,
    report,
    period,
  } = data;

  // helper
  const numberToRoman = (num: number): string => {
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return roman[num - 1] ?? num.toString();
  };

  const semesterToLabel = (s: typeof semester): string => {
    return s === 'GANJIL' ? 'I (Satu)' : 'II (Dua)';
  };

  const periodToLabel = (p: typeof period): string => {
    return p === 'MID_SEMESTER' ? 'Tengah Semester' : 'Akhir Semester';
  };

  // Get the appropriate scores based on period
  const currentTahsinScore =
    period === 'MID_SEMESTER' ? report.midTahsinScore : report.endTahsinScore;
  const currentTahfidzScore =
    period === 'MID_SEMESTER' ? report.midTahfidzScore : report.endTahfidzScore;

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
          <strong>Periode:</strong> {periodToLabel(period)}
          <br />
          <strong>Tahun Ajaran:</strong> {academicYear}
          <br />
          <strong>Nama Sekolah:</strong> {schoolInfo.schoolName}
          <br />
          <strong>Alamat Siswa:</strong> {address || '-'}
        </div>

        <hr className="my-2" />

        <div>
          <strong>A. Evaluasi Tahsin</strong>
          <ul className="list-disc pl-5">
            {tahsin.map((s, i) => (
              <li key={i}>
                {s.topic} - {s.score} ({s.grade}): {s.description}
              </li>
            ))}
          </ul>
          <p>
            <strong>Rata-rata:</strong> {currentTahsinScore?.toFixed(1) ?? '-'} <br />
            <strong>Bacaan Terakhir:</strong> {report.lastTahsinMaterial ?? '-'}
          </p>
        </div>

        <div>
          <strong>B. Evaluasi Tahfidz</strong>
          <ul className="list-disc pl-5">
            {tahfidz.map((s, i) => (
              <li key={i}>
                {s.surahName} - {s.score} ({s.grade}): {s.description}
              </li>
            ))}
          </ul>
          <p>
            <strong>Rata-rata:</strong> {currentTahfidzScore?.toFixed(1) ?? '-'}
          </p>
        </div>

        <div>
          <strong>Guru Pembimbing:</strong> {teacherName}
        </div>

        <PDFDownloadLink
          document={<StudentReportPdf data={data} />}
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
