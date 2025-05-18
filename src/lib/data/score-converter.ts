import { GradeLetter } from '@prisma/client';

export function convertToLetter(score: number): GradeLetter {
  if (score >= 92) return 'A';
  if (score >= 83) return 'B';
  if (score >= 75) return 'C';
  return 'D';
}
