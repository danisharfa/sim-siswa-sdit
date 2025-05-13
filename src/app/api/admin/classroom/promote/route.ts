import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Semester } from '@prisma/client';
import { auth } from '@/auth';
import { addOneYearToAcademicYear } from '@/lib/data/classroom'; // ⬅️ helper fungsi kecil (dibuat di bawah)

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 });
    }

    const students = await prisma.studentProfile.findMany({
      where: {
        id: { in: studentIds },
        status: 'AKTIF',
      },
      include: {
        classroom: true,
        group: { include: { teacherGroup: true } },
      },
    });

    const results: string[] = [];

    for (const student of students) {
      const currentClass = student.classroom;
      if (!currentClass) continue;

      // Simpan histori kelas dan kelompok
      await prisma.classroomHistory.create({
        data: {
          studentId: student.id,
          classroomId: currentClass.id,
          academicYear: currentClass.academicYear,
          semester: currentClass.semester,
        },
      });

      if (student.groupId) {
        await prisma.groupHistory.create({
          data: {
            studentId: student.id,
            groupId: student.groupId,
            teacherId: student.group?.teacherGroup?.[0]?.teacherId || null,
            academicYear: currentClass.academicYear,
            semester: currentClass.semester,
          },
        });
      }

      const isGraduating = currentClass.name.startsWith('6') && currentClass.semester === 'GENAP';
      let nextClassroomId = null;

      if (!isGraduating) {
        if (currentClass.semester === 'GANJIL') {
          // Naik ke semester GENAP di kelas yang sama
          const kelasGenap = await prisma.classroom.upsert({
            where: {
              name_academicYear_semester: {
                name: currentClass.name,
                academicYear: currentClass.academicYear,
                semester: Semester.GENAP,
              },
            },
            update: {},
            create: {
              id: `KELAS-${crypto.randomUUID()}`,
              name: currentClass.name,
              academicYear: currentClass.academicYear,
              semester: Semester.GENAP,
            },
          });
          nextClassroomId = kelasGenap.id;
        } else {
          // GENAP ➝ GANJIL tahun ajaran berikut dan nama kelas naik tingkat
          const [grade, ...rest] = currentClass.name.split(' ');
          const nextGrade = parseInt(grade) + 1;
          const nextClassName = `${nextGrade} ${rest.join(' ')}`.trim();
          const nextAcademicYear = addOneYearToAcademicYear(currentClass.academicYear);

          const kelasGanjil = await prisma.classroom.upsert({
            where: {
              name_academicYear_semester: {
                name: nextClassName,
                academicYear: nextAcademicYear,
                semester: Semester.GANJIL,
              },
            },
            update: {},
            create: {
              id: `KELAS-${crypto.randomUUID()}`,
              name: nextClassName,
              academicYear: nextAcademicYear,
              semester: Semester.GANJIL,
            },
          });

          nextClassroomId = kelasGanjil.id;
        }
      }

      await prisma.studentProfile.update({
        where: { id: student.id },
        data: {
          classroomId: isGraduating ? null : nextClassroomId,
          groupId: null,
          status: isGraduating ? 'LULUS' : 'AKTIF',
          graduatedAt: isGraduating ? new Date() : null,
        },
      });

      results.push(`${student.nis} → ${isGraduating ? 'LULUS' : nextClassroomId}`);
    }

    return NextResponse.json({
      success: true,
      message: `${results.length} siswa berhasil dipromosikan.`,
      data: results,
    });
  } catch (error) {
    console.error('Gagal mempromosikan siswa:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mempromosikan siswa' },
      { status: 500 }
    );
  }
}
