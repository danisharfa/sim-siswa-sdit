import {
  LayoutDashboard,
  User2Icon,
  UserCog,
  BookOpenIcon,
  ClipboardList,
  ClipboardCheck,
  CalendarCheck2,
  FileCog,
  BookPlus,
  Users2,
  ScrollText,
  Target,
} from 'lucide-react';
import { FaChalkboardTeacher } from 'react-icons/fa';
import { ImProfile } from 'react-icons/im';

export const menuData = {
  admin: [
    {
      title: 'Beranda',
      url: '/dashboard/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'Manajemen',
      items: [
        {
          title: 'Pengguna',
          url: '/dashboard/admin/users',
          icon: UserCog,
        },
        {
          title: 'Kelas',
          url: '/dashboard/admin/classroom',
          icon: FaChalkboardTeacher,
        },
        {
          title: 'Data Global',
          url: '/dashboard/admin/configuration',
          icon: FileCog,
        },
      ],
    },
  ],
  coordinator: [
    {
      title: 'Beranda',
      url: '/dashboard/coordinator',
      icon: LayoutDashboard,
    },
    {
      title: 'Koordinator',
      url: '/dashboard/coordinator/profile',
      icon: ImProfile,
    },
    {
      title: 'Kelompok',
      url: '/dashboard/coordinator/group',
      icon: Users2,
    },
    {
      label: 'Tashih',
      items: [
        {
          title: 'Permintaan',
          url: '/dashboard/coordinator/tashih/requests',
          icon: ClipboardList,
        },
        {
          title: 'Penjadwalan',
          url: '/dashboard/coordinator/tashih/schedules',
          icon: CalendarCheck2,
        },
        {
          title: 'Penilaian',
          url: '/dashboard/coordinator/tashih/results',
          icon: ClipboardCheck,
        },
      ],
    },
    {
      label: 'Munaqasyah',
      items: [
        {
          title: 'Permintaan',
          url: '/dashboard/coordinator/munaqasyah/requests',
          icon: ClipboardList,
        },
        {
          title: 'Penjadwalan',
          url: '/dashboard/coordinator/munaqasyah/schedules',
          icon: CalendarCheck2,
        },
        {
          title: 'Penilaian',
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
    },
    {
      title: 'Guru',
      url: '/dashboard/teacher/profile',
      icon: ImProfile,
    },
    {
      title: 'Kelompok',
      url: '/dashboard/teacher/group',
      icon: Users2,
    },
    {
      label: 'Setoran',
      items: [
        {
          title: 'Input Target',
          url: '/dashboard/teacher/submission/target/input',
          icon: Target,
        },
        {
          title: 'Riwayat Target',
          url: '/dashboard/teacher/submission/target/history',
          icon: BookOpenIcon,
        },
        {
          title: 'Input',
          url: '/dashboard/teacher/submission/input',
          icon: BookPlus,
        },
        {
          title: 'Riwayat',
          url: '/dashboard/teacher/submission/history',
          icon: BookOpenIcon,
        },
      ],
    },
    {
      label: 'Aktivitas Rumah',
      items: [
        {
          title: 'Riwayat',
          url: '/dashboard/teacher/home-activity',
          icon: BookOpenIcon,
        },
      ],
    },
    {
      label: 'Tashih',
      items: [
        {
          title: 'Pendaftaran',
          url: '/dashboard/teacher/tashih/request',
          icon: ClipboardList,
        },
        {
          title: 'Jadwal',
          url: '/dashboard/teacher/tashih/schedule',
          icon: CalendarCheck2,
        },
        {
          title: 'Hasil',
          url: '/dashboard/teacher/tashih/result',
          icon: ClipboardCheck,
        },
      ],
    },
    {
      label: 'Munaqasyah',
      items: [
        {
          title: 'Pendaftaran',
          url: '/dashboard/teacher/munaqasyah/request',
          icon: ClipboardList,
        },
        {
          title: 'Jadwal',
          url: '/dashboard/teacher/munaqasyah/schedule',
          icon: CalendarCheck2,
        },
        {
          title: 'Penilaian',
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
          title: 'Target',
          url: '/dashboard/student/submission/target',
          icon: Target,
        },
        {
          title: 'Riwayat',
          url: '/dashboard/student/submission',
          icon: BookOpenIcon,
        },
      ],
    },
    {
      label: 'Aktivitas Rumah',
      items: [
        {
          title: 'Input',
          url: '/dashboard/student/home-activity/input',
          icon: BookPlus,
        },
        {
          title: 'Riwayat',
          url: '/dashboard/student/home-activity/history',
          icon: BookOpenIcon,
        },
      ],
    },
    {
      label: 'Tashih',
      items: [
        {
          title: 'Jadwal',
          url: '/dashboard/student/tashih/schedule',
          icon: CalendarCheck2,
        },
        {
          title: 'Hasil',
          url: '/dashboard/student/tashih/result',
          icon: ClipboardCheck,
        },
      ],
    },
    {
      label: 'Munaqasyah',
      items: [
        {
          title: 'Jadwal',
          url: '/dashboard/student/munaqasyah/schedule',
          icon: CalendarCheck2,
        },
        {
          title: 'Hasil',
          url: '/dashboard/student/munaqasyah/result',
          icon: ClipboardCheck,
        },
      ],
    },
  ],
};
