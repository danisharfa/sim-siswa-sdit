import { MunaqasyahGrade } from '@prisma/client';

//Untuk membulatkan angka ke 1 desimal
const round1 = (n: number) => parseFloat(n.toFixed(1));

export type TasmiDetailInput = {
  surahId: number;
  initialScore: number;
  khofiAwalAyat: number;
  khofiMakhroj: number;
  khofiTajwidMad: number;
  jaliBaris: number;
  jaliLebihSatuKalimat: number;
  note?: string;
};

export type MunaqasyahDetailInput = {
  questionNo: number; // 1..5
  khofiAwalAyat: number;
  khofiMakhroj: number;
  khofiTajwidMad: number;
  jaliBaris: number;
  jaliLebihSatuKalimat: number;
  note?: string;
};

export const clamp100 = (value: number): number => Math.max(0, Math.min(100, value));

export const scoreToGrade = (score: number): MunaqasyahGrade => {
  if (score >= 91) return MunaqasyahGrade.MUMTAZ;
  if (score >= 85) return MunaqasyahGrade.JAYYID_JIDDAN;
  if (score >= 80) return MunaqasyahGrade.JAYYID;
  return MunaqasyahGrade.TIDAK_LULUS;
};

export const calculateTasmiRawTotal = (row: TasmiDetailInput): number => {
  const totalKhofi = (row.khofiAwalAyat ?? 0) + (row.khofiMakhroj ?? 0) + (row.khofiTajwidMad ?? 0);
  const totalJali = (row.jaliBaris ?? 0) + (row.jaliLebihSatuKalimat ?? 0);
  const rawScore = (row.initialScore ?? 0) - 2 * totalKhofi - 5 * totalJali;
  return Math.max(0, rawScore);
};

export const calculateTasmiPercentage = (row: TasmiDetailInput): number => {
  const rawTotal = calculateTasmiRawTotal(row);
  const initialScore = row.initialScore ?? 0;
  return initialScore > 0 ? (rawTotal / initialScore) * 100 : 0;
};

export const calculateTasmiTotalScore = (tasmiDetails: TasmiDetailInput[]) => {
  if (tasmiDetails.length === 0) {
    return { surahScores: [], totalScore: 0, detailsToSave: [] };
  }

  const surahScores: number[] = [];
  const detailsToSave: Array<{
    surahId: number;
    initialScore: number;
    khofiAwalAyat: number;
    khofiMakhroj: number;
    khofiTajwidMad: number;
    jaliBaris: number;
    jaliLebihSatuKalimat: number;
    totalScore: number; // ⬅️ kini menyimpan % (0–100), 1 desimal
    note?: string;
  }> = [];

  for (const detail of tasmiDetails) {
    const percentage = calculateTasmiPercentage(detail);
    const percentageRounded = round1(percentage); // ⬅️ 1 desimal
    surahScores.push(percentageRounded);

    detailsToSave.push({
      surahId: detail.surahId,
      initialScore: detail.initialScore,
      khofiAwalAyat: detail.khofiAwalAyat ?? 0,
      khofiMakhroj: detail.khofiMakhroj ?? 0,
      khofiTajwidMad: detail.khofiTajwidMad ?? 0,
      jaliBaris: detail.jaliBaris ?? 0,
      jaliLebihSatuKalimat: detail.jaliLebihSatuKalimat ?? 0,
      totalScore: percentageRounded, // ⬅️ simpan % ke DB
      note: detail.note,
    });
  }

  const avgPercent = surahScores.reduce((a, b) => a + b, 0) / surahScores.length;
  const totalScore = round1(clamp100(avgPercent)); // ⬅️ 1 desimal

  return { surahScores, totalScore, detailsToSave };
};

export const calculateMunaqasyahRawTotal = (row: MunaqasyahDetailInput): number => {
  const totalKhofi = (row.khofiAwalAyat ?? 0) + (row.khofiMakhroj ?? 0) + (row.khofiTajwidMad ?? 0);
  const totalJali = (row.jaliBaris ?? 0) + (row.jaliLebihSatuKalimat ?? 0);
  const rawScore = 50 - 2 * totalKhofi - 3 * totalJali;
  return Math.max(0, rawScore);
};

export const calculateMunaqasyahPercentage = (row: MunaqasyahDetailInput): number => {
  const rawTotal = calculateMunaqasyahRawTotal(row);
  return (rawTotal / 50) * 100;
};


export const calculateMunaqasyahTotalScore = (munaqasyahDetails: MunaqasyahDetailInput[]) => {
  if (munaqasyahDetails.length !== 5) {
    throw new Error('Munaqasyah must have exactly 5 questions');
  }

  const questionScores: number[] = [];
  const detailsToSave: Array<{
    questionNo: number;
    khofiAwalAyat: number;
    khofiMakhroj: number;
    khofiTajwidMad: number;
    jaliBaris: number;
    jaliLebihSatuKalimat: number;
    totalScore: number; // tetap raw basis 50 (seperti sebelumnya)
    note?: string;
  }> = [];

  for (const detail of munaqasyahDetails) {
    const rawTotal = calculateMunaqasyahRawTotal(detail);
    const percentage = calculateMunaqasyahPercentage(detail);

    questionScores.push(percentage);
    detailsToSave.push({
      questionNo: detail.questionNo,
      khofiAwalAyat: detail.khofiAwalAyat ?? 0,
      khofiMakhroj: detail.khofiMakhroj ?? 0,
      khofiTajwidMad: detail.khofiTajwidMad ?? 0,
      jaliBaris: detail.jaliBaris ?? 0,
      jaliLebihSatuKalimat: detail.jaliLebihSatuKalimat ?? 0,
      totalScore: rawTotal, // tetap raw
      note: detail.note,
    });
  }

  const avgPercent = questionScores.reduce((a, b) => a + b, 0) / questionScores.length;
  const totalScore = round1(clamp100(avgPercent)); // ⬅️ 1 desimal

  return { questionScores, totalScore, detailsToSave };
};

export const calculateFinalScore = (tasmiScore: number, munaqasyahScore: number): number => {
  // ⬇️ hasil akhir dibulatkan 1 desimal juga (rapi & konsisten)
  return round1(clamp100(tasmiScore * 0.7 + munaqasyahScore * 0.3));
};

export const validateTasmiDetails = (tasmiDetails: TasmiDetailInput[]) => {
  if (!Array.isArray(tasmiDetails) || tasmiDetails.length === 0) {
    return { isValid: false, error: 'Detail Tasmi kosong' };
  }

  for (const detail of tasmiDetails) {
    if (!detail.initialScore || detail.initialScore < 1) {
      return { isValid: false, error: 'Nilai awal Tasmi harus minimal 1' };
    }

    if (
      detail.khofiAwalAyat < 0 ||
      detail.khofiMakhroj < 0 ||
      detail.khofiTajwidMad < 0 ||
      detail.jaliBaris < 0 ||
      detail.jaliLebihSatuKalimat < 0
    ) {
      return { isValid: false, error: 'Jumlah kesalahan tidak boleh negatif' };
    }
  }

  return { isValid: true, error: null };
};

export const validateMunaqasyahDetails = (munaqasyahDetails: MunaqasyahDetailInput[]) => {
  if (!Array.isArray(munaqasyahDetails) || munaqasyahDetails.length !== 5) {
    return { isValid: false, error: 'Detail Munaqasyah harus 5 soal' };
  }

  for (const detail of munaqasyahDetails) {
    if (
      detail.khofiAwalAyat < 0 ||
      detail.khofiMakhroj < 0 ||
      detail.khofiTajwidMad < 0 ||
      detail.jaliBaris < 0 ||
      detail.jaliLebihSatuKalimat < 0
    ) {
      return { isValid: false, error: 'Jumlah kesalahan tidak boleh negatif' };
    }
  }

  return { isValid: true, error: null };
};
