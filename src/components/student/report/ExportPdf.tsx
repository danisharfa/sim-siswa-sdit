import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { StudentReportData } from '@/lib/data/student/report';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, fontFamily: 'Helvetica' },
  headerSection: { flexDirection: 'row', alignItems: 'center' },
  leftLogo: { width: 50, height: 50 },
  rightLogo: { width: 88, height: 50 },
  centerHeader: { textAlign: 'center', fontSize: 11 },
  section: { marginVertical: 10 },
  studentDataRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  studentLabel: {
    width: '20%',
    fontSize: 11,
  },
  studentSeparator: {
    width: '2%',
    fontSize: 11,
    textAlign: 'center',
  },
  studentValue: {
    width: '78%',
    fontSize: 11,
  },
  heading: { fontSize: 14, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
    paddingVertical: 4,
    alignItems: 'center',
  },
  header: { borderBottom: '2px solid #000', fontWeight: 'bold', backgroundColor: '#f0f0f0' },
  cellNo: { width: '7%', textAlign: 'center' },
  cellTopic: { width: '30%', paddingLeft: 4 },
  cellScoreDouble: { width: '20%', flexDirection: 'row' },
  cellDesc: { width: '43%', paddingLeft: 4 },
  scoreHeaderWrapper: {
    flexDirection: 'column',
    width: '20%',
    borderLeft: '1px solid #000',
    borderRight: '1px solid #000',
  },
  scoreHeaderTop: { textAlign: 'center', fontWeight: 'bold', borderBottom: '1px solid #000' },
  scoreHeaderBottom: { flexDirection: 'row' },
  scoreHeaderItem: { flex: 1, textAlign: 'center', borderRight: '1px solid #000' },
  scoreText: { fontSize: 11, paddingVertical: 1, textAlign: 'center', width: '50%' },
  separator: { borderBottom: '1.5px solid #000', marginVertical: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  footerCol: { width: '45%', alignItems: 'center' },
  kkmTable: { border: '1px solid #000', marginTop: 12 },
  kkmRow: { flexDirection: 'row', borderBottom: '1px solid #000' },
  kkmCell: { borderRight: '1px solid #000', padding: 4, textAlign: 'center' },
  pembimbingRow: {
    flexDirection: 'row',
    borderTop: '1px solid #000',
    borderBottom: '1px solid #000',
  },
  pembimbingText: {
    width: '100%',
    textAlign: 'center',
    padding: 4,
  },
});

interface ExportPdfProps {
  data: StudentReportData;
  selectedPeriodIndex?: number;
}

export function ExportPdf({ data, selectedPeriodIndex = 0 }: ExportPdfProps) {
  const { fullName, nis, nisn, address, schoolInfo, coordinatorName, allReports } = data;

  const selectedReport = allReports[selectedPeriodIndex] || allReports[0];

  if (!selectedReport) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Tidak ada data rapor tersedia</Text>
        </Page>
      </Document>
    );
  }

  const {
    period: { className, academicYear, semester, teacherName, assessmentPeriod },
    tahsin,
    tahfidz,
    report,
  } = selectedReport;

  const leftLogo = '/logo-sekolah.png';
  const rightLogo = '/logo-wafa.png';

  // Dynamic assessment period text
  const assessmentPeriodText =
    assessmentPeriod === 'MID_SEMESTER' ? 'ASESMEN TENGAH SEMESTER' : 'ASESMEN AKHIR SEMESTER';

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Logo + Title */}
        <View style={styles.headerSection}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={leftLogo} style={styles.leftLogo} />
          <View style={[styles.centerHeader, { flex: 1 }]}>
            <Text>{schoolInfo.schoolName.toUpperCase()}</Text>
            <Text>LAPORAN PENILAIAN TAHSIN DAN TAHFIDZ AL-QUR&apos;AN</Text>
            <Text>
              {assessmentPeriodText} {semester}
            </Text>
            <Text>TAHUN AJARAN {academicYear}</Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={rightLogo} style={styles.rightLogo} />
        </View>
        <View style={styles.separator} />

        {/* Data Siswa */}
        <View style={styles.section}>
          <View style={styles.studentDataRow}>
            <Text style={styles.studentLabel}>Nama Peserta Didik</Text>
            <Text style={styles.studentSeparator}>:</Text>
            <Text style={styles.studentValue}>{fullName}</Text>
          </View>

          <View style={styles.studentDataRow}>
            <Text style={styles.studentLabel}>NISN / NIS</Text>
            <Text style={styles.studentSeparator}>:</Text>
            <Text style={styles.studentValue}>
              {nisn} / {nis}
            </Text>
          </View>

          <View style={styles.studentDataRow}>
            <Text style={styles.studentLabel}>Kelas / Semester</Text>
            <Text style={styles.studentSeparator}>:</Text>
            <Text style={styles.studentValue}>
              {className} / {semester === 'GANJIL' ? 'I (Satu)' : 'II (Dua)'}
            </Text>
          </View>

          <View style={styles.studentDataRow}>
            <Text style={styles.studentLabel}>Tahun Ajaran</Text>
            <Text style={styles.studentSeparator}>:</Text>
            <Text style={styles.studentValue}>{academicYear}</Text>
          </View>

          <View style={styles.studentDataRow}>
            <Text style={styles.studentLabel}>Nama Sekolah</Text>
            <Text style={styles.studentSeparator}>:</Text>
            <Text style={styles.studentValue}>{schoolInfo.schoolName}</Text>
          </View>

          <View style={styles.studentDataRow}>
            <Text style={styles.studentLabel}>Alamat Siswa</Text>
            <Text style={styles.studentSeparator}>:</Text>
            <Text style={styles.studentValue}>{address ?? '-'}</Text>
          </View>
        </View>

        {/* A. Evaluasi Tahsin */}
        <View style={styles.section}>
          <Text style={styles.heading}>A. EVALUASI TAHSIN</Text>
          <View style={[styles.row, styles.header]}>
            <Text style={styles.cellNo}>No.</Text>
            <Text style={styles.cellTopic}>Uraian</Text>
            <View style={styles.scoreHeaderWrapper}>
              <Text style={styles.scoreHeaderTop}>Nilai</Text>
              <View style={styles.scoreHeaderBottom}>
                <Text style={styles.scoreHeaderItem}>Angka</Text>
                <Text style={styles.scoreHeaderItem}>Huruf</Text>
              </View>
            </View>
            <Text style={styles.cellDesc}>Deskripsi</Text>
          </View>
          {tahsin.map(
            (
              s: { topic: string; score: number; grade: string; description: string },
              i: number
            ) => (
              <View style={styles.row} key={i}>
                <Text style={styles.cellNo}>{i + 1}</Text>
                <Text style={styles.cellTopic}>{s.topic}</Text>
                <View style={styles.cellScoreDouble}>
                  <Text style={styles.scoreText}>{s.score}</Text>
                  <Text style={styles.scoreText}>{s.grade}</Text>
                </View>
                <Text style={styles.cellDesc}>{s.description}</Text>
              </View>
            )
          )}
          <View style={styles.row}>
            <Text style={styles.cellNo}></Text>
            <Text style={[styles.cellTopic, { fontWeight: 'bold' }]}>Rata-rata Tahsin</Text>
            <View style={styles.cellScoreDouble}>
              <Text style={[styles.scoreText, { fontWeight: 'bold' }]}>
                {report.endTahsinScore?.toFixed(1) ?? '-'}
              </Text>
              <Text style={styles.scoreText}></Text>
            </View>
            <Text style={styles.cellDesc}></Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellNo}></Text>
            <Text style={[styles.cellTopic, { fontWeight: 'bold' }]}>Bacaan Terakhir</Text>
            <View style={styles.cellScoreDouble}></View>
            <Text style={[styles.cellDesc, { fontWeight: 'bold' }]}>
              {report.lastTahsinMaterial ?? '-'}
            </Text>
          </View>
        </View>

        {/* B. Evaluasi Tahfidz */}
        <View style={styles.section}>
          <Text style={styles.heading}>B. EVALUASI TAHFIDZ</Text>
          <View style={[styles.row, styles.header]}>
            <Text style={styles.cellNo}>No.</Text>
            <Text style={styles.cellTopic}>Uraian</Text>
            <View style={styles.scoreHeaderWrapper}>
              <Text style={styles.scoreHeaderTop}>Nilai</Text>
              <View style={styles.scoreHeaderBottom}>
                <Text style={styles.scoreHeaderItem}>Angka</Text>
                <Text style={styles.scoreHeaderItem}>Huruf</Text>
              </View>
            </View>
            <Text style={styles.cellDesc}>Deskripsi</Text>
          </View>
          {tahfidz.map(
            (
              s: {
                surahName: string;
                score: number;
                grade: string;
                description: string;
              },
              i: number
            ) => (
              <View style={styles.row} key={i}>
                <Text style={styles.cellNo}>{i + 1}</Text>
                <Text style={styles.cellTopic}>{s.surahName}</Text>
                <View style={styles.cellScoreDouble}>
                  <Text style={styles.scoreText}>{s.score}</Text>
                  <Text style={styles.scoreText}>{s.grade}</Text>
                </View>
                <Text style={styles.cellDesc}>{s.description}</Text>
              </View>
            )
          )}
          <View style={styles.row}>
            <Text style={styles.cellNo}></Text>
            <Text style={[styles.cellTopic, { fontWeight: 'bold' }]}>Rata-rata Tahfidz</Text>
            <View style={styles.cellScoreDouble}>
              <Text style={[styles.scoreText, { fontWeight: 'bold' }]}>
                {report.endTahfidzScore?.toFixed(1) ?? '-'}
              </Text>
              <Text style={styles.scoreText}></Text>
            </View>
            <Text style={styles.cellDesc}></Text>
          </View>
        </View>

        {/* Tabel KKM */}
        <View style={styles.kkmTable}>
          <View style={styles.kkmRow}>
            <View style={[styles.kkmCell, { width: '25%' }]}>
              <Text>KKM (Kriteria Ketuntasan Minimal)</Text>
            </View>
            <View style={[styles.kkmCell, { width: '75%' }]}>
              <Text>Keterangan Nilai</Text>
            </View>
          </View>
          {(
            [
              ['92-100', 'A', 'Sangat Baik'],
              ['83-91', 'B', 'Baik'],
              ['75-82', 'C', 'Cukup'],
              ['< 75', 'D', 'Kurang'],
            ] as const
          ).map(([range, grade, desc], i: number) => (
            <View style={styles.kkmRow} key={i}>
              <View style={[styles.kkmCell, { width: '25%' }]}>
                {i === 0 ? <Text>75</Text> : null}
              </View>
              <View style={[styles.kkmCell, { width: '20%' }]}>
                <Text>{range}</Text>
              </View>
              <View style={[styles.kkmCell, { width: '10%' }]}>
                <Text>{grade}</Text>
              </View>
              <View style={[styles.kkmCell, { width: '45%', borderRight: 'none' }]}>
                <Text>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pembimbing */}
        <View style={styles.pembimbingRow}>
          <Text style={styles.pembimbingText}>Pembimbing : {teacherName}</Text>
        </View>

        {/* Tanda Tangan */}
        <View style={{ marginTop: 30 }}>
          <Text style={{ textAlign: 'center', marginBottom: 12 }}>Mengetahui,</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '45%', alignItems: 'center' }}>
              <Text>Kepala Sekolah</Text>
              <Text>{schoolInfo.schoolName}</Text>
              <Text style={{ marginTop: 40 }}>{schoolInfo.currrentPrincipalName}</Text>
            </View>
            <View style={{ width: '45%', alignItems: 'center' }}>
              <Text>Mataram, {today}</Text>
              <Text>Koordinator Al-Qur&apos;an</Text>
              <Text style={{ marginTop: 40 }}>{coordinatorName}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
