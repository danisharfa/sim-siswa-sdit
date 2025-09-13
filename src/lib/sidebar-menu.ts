import {
  LayoutDashboard,
  User2Icon,
  UserCog,
  BookOpenIcon,
  ClipboardList,
  ClipboardCheck,
  CalendarCheck2,
  BookPlus,
  ScrollText,
  Target,
  GraduationCap,
} from 'lucide-react';
import { FaChalkboard, FaUsers } from 'react-icons/fa';
import { ImProfile } from 'react-icons/im';

export const menuData = {
  admin: [
    {
      title: 'Beranda',
      url: '/dashboard/admin',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: 'Pengguna',
      url: '/dashboard/admin/users',
      icon: UserCog,
    },
    {
      title: 'Kelas',
      url: '/dashboard/admin/classroom',
      icon: FaChalkboard,
    },
    {
      title: 'Akademik',
      url: '/dashboard/admin/configuration',
      icon: GraduationCap,
    },
  ],
  coordinator: [
    {
      title: 'Beranda',
      url: '/dashboard/coordinator',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: 'Koordinator',
      url: '/dashboard/coordinator/profile',
      icon: ImProfile,
    },
    {
      title: 'Kelompok',
      url: '/dashboard/coordinator/group',
      icon: FaUsers,
    },
    {
      label: 'Setoran Siswa',
      items: [
        {
          title: 'Riwayat Setoran',
          url: '/dashboard/coordinator/submission',
          icon: BookOpenIcon,
        },
        {
          title: 'Riwayat Aktivitas Rumah',
          url: '/dashboard/coordinator/home-activity',
          icon: BookOpenIcon,
        },
      ],
    },
    {
      label: 'Tashih',
      items: [
        {
          title: 'Permintaan Tashih',
          url: '/dashboard/coordinator/tashih/requests',
          icon: ClipboardList,
        },
        {
          title: 'Penjadwalan Tashih',
          url: '/dashboard/coordinator/tashih/schedules',
          icon: CalendarCheck2,
        },
        {
          title: 'Penilaian Tashih',
          url: '/dashboard/coordinator/tashih/results',
          icon: ClipboardCheck,
        },
      ],
    },
    {
      label: 'Munaqasyah',
      items: [
        {
          title: 'Permintaan Munaqasyah',
          url: '/dashboard/coordinator/munaqasyah/requests',
          icon: ClipboardList,
        },
        {
          title: 'Penjadwalan Munaqasyah',
          url: '/dashboard/coordinator/munaqasyah/schedules',
          icon: CalendarCheck2,
        },
        {
          title: 'Penilaian Munaqasyah',
          url: '/dashboard/coordinator/munaqasyah/results',
          icon: ClipboardCheck,
        },
      ],
    },
  ],
  teacher: [
    {
      title: 'Beranda',
      url: '/dashboard/teacher',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: 'Guru',
      url: '/dashboard/teacher/profile',
      icon: ImProfile,
    },
    {
      title: 'Kelompok',
      url: '/dashboard/teacher/group',
      icon: FaUsers,
    },
    {
      label: 'Setoran Siswa',
      items: [
        {
          title: 'Input Target Setoran',
          url: '/dashboard/teacher/submission/target/input',
          icon: Target,
        },
        {
          title: 'Riwayat Target Setoran',
          url: '/dashboard/teacher/submission/target/history',
          icon: BookOpenIcon,
        },
        {
          title: 'Input Setoran',
          url: '/dashboard/teacher/submission/input',
          icon: BookPlus,
        },
        {
          title: 'Riwayat Setoran',
          url: '/dashboard/teacher/submission/history',
          icon: BookOpenIcon,
        },
        {
          title: 'Riwayat Aktivitas Rumah',
          url: '/dashboard/teacher/home-activity',
          icon: BookOpenIcon,
        },
      ],
    },
    {
      label: 'Tashih',
      items: [
        {
          title: 'Pendaftaran Tashih',
          url: '/dashboard/teacher/tashih/request',
          icon: ClipboardList,
        },
        {
          title: 'Jadwal Tashih',
          url: '/dashboard/teacher/tashih/schedule',
          icon: CalendarCheck2,
        },
        {
          title: 'Hasil Tashih',
          url: '/dashboard/teacher/tashih/result',
          icon: ClipboardCheck,
        },
      ],
    },
    {
      label: 'Munaqasyah',
      items: [
        {
          title: 'Pendaftaran Munaqasyah',
          url: '/dashboard/teacher/munaqasyah/request',
          icon: ClipboardList,
        },
        {
          title: 'Jadwal Munaqasyah',
          url: '/dashboard/teacher/munaqasyah/schedule',
          icon: CalendarCheck2,
        },
        {
          title: 'Penilaian Munaqasyah',
          url: '/dashboard/teacher/munaqasyah/assessment',
          icon: ClipboardCheck,
        },
      ],
    },
  ],
  student: [
    {
      title: 'Beranda',
      url: '/dashboard/student',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: 'Siswa',
      url: '/dashboard/student/profile',
      icon: User2Icon,
    },
    {
      title: 'Rapor',
      url: '/dashboard/student/report',
      icon: ScrollText,
    },
    {
      label: 'Setoran',
      items: [
        {
          title: 'Target Setoran',
          url: '/dashboard/student/submission/target',
          icon: Target,
        },
        {
          title: 'Riwayat Setoran',
          url: '/dashboard/student/submission',
          icon: BookOpenIcon,
        },
        {
          title: 'Input Aktivitas Rumah',
          url: '/dashboard/student/home-activity/input',
          icon: BookPlus,
        },
        {
          title: 'Riwayat Aktivitas Rumah',
          url: '/dashboard/student/home-activity/history',
          icon: BookOpenIcon,
        },
      ],
    },
    {
      label: 'Tashih',
      items: [
        {
          title: 'Jadwal Tashih',
          url: '/dashboard/student/tashih/schedule',
          icon: CalendarCheck2,
        },
        {
          title: 'Hasil Tashih',
          url: '/dashboard/student/tashih/result',
          icon: ClipboardCheck,
        },
      ],
    },
    {
      label: 'Munaqasyah',
      items: [
        {
          title: 'Jadwal Munaqasyah',
          url: '/dashboard/student/munaqasyah/schedule',
          icon: CalendarCheck2,
        },
        {
          title: 'Hasil Munaqasyah',
          url: '/dashboard/student/munaqasyah/result',
          icon: ClipboardCheck,
        },
      ],
    },
  ],
};
