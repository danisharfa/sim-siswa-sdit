import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { addOneYearToAcademicYear } from '@/lib/data/classroom';
import { Role, Semester, StudentStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ success: false, message: 'Data tidak valid' }, { status: 400 });
    }

    const students = await prisma.studentProfile.findMany({
      where: {
        userId: { in: studentIds },
        status: StudentStatus.AKTIF,
      },
      include: {
        classroom: true,
        group: {
          include: {
            teacher: true,
          },
        },
      },
    });

    const results: string[] = [];
    const processedClassrooms = new Set<string>(); // Track kelas yang sudah diproses

    for (const student of students) {
      const currentClass = student.classroom;
      if (!currentClass) continue;

      // Simpan histori kelas
      await prisma.classroomHistory.create({
        data: {
          studentId: student.userId,
          classroomId: currentClass.id,
          academicYear: currentClass.academicYear,
          semester: currentClass.semester,
        },
      });

      // Simpan histori kelompok (gunakan variabel lokal agar tidak hilang)
      const prevGroupId = student.groupId;
      const prevTeacherId = student.group?.teacher?.userId || null;

      if (prevGroupId) {
        await prisma.groupHistory.create({
          data: {
            studentId: student.userId,
            groupId: prevGroupId,
            teacherId: prevTeacherId,
            academicYear: currentClass.academicYear,
            semester: currentClass.semester,
          },
        });
      }

      // Cek apakah siswa lulus
      const isGraduating =
        currentClass.name.startsWith('6') && currentClass.semester === Semester.GENAP;
      let nextClassroomId: string | null = null;

      if (!isGraduating) {
        if (currentClass.semester === Semester.GANJIL) {
          // Naik ke semester GENAP
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
          // Naik ke tahun berikut & nama kelas naik tingkat
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

      // Update siswa
      await prisma.studentProfile.update({
        where: { userId: student.userId },
        data: {
          classroomId: isGraduating ? null : nextClassroomId,
          groupId: null,
          status: isGraduating ? StudentStatus.LULUS : StudentStatus.AKTIF,
          graduatedAt: isGraduating ? new Date() : null,
        },
      });

      // Aktifkan kelas baru jika ada
      if (nextClassroomId) {
        await prisma.classroom.update({
          where: { id: nextClassroomId },
          data: { isActive: true },
        });
      }

      results.push(`${student.nis} → ${isGraduating ? StudentStatus.LULUS : nextClassroomId}`);

      // Tambahkan kelas lama ke set untuk dicek nanti
      processedClassrooms.add(currentClass.id);
    }

    // Cek dan nonaktifkan kelas lama jika sudah kosong
    for (const classroomId of processedClassrooms) {
      // Hitung jumlah siswa aktif yang masih ada di kelas ini
      const remainingActiveStudents = await prisma.studentProfile.count({
        where: {
          classroomId: classroomId,
          status: StudentStatus.AKTIF,
        },
      });

      // Jika tidak ada siswa aktif yang tersisa, nonaktifkan kelas
      if (remainingActiveStudents === 0) {
        await prisma.classroom.update({
          where: { id: classroomId },
          data: { isActive: false },
        });
      }
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
