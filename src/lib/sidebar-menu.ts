import {
  ClipboardPenLine,
  Group,
  LayoutDashboard,
  MonitorCogIcon,
  School,
  User2Icon,
  UserCog,
} from 'lucide-react';

import { UserGroupIcon } from '@heroicons/react/24/outline';

export const menuData = {
  admin: [
    {
      title: 'Dashboard',
      url: '/dashboard/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'Manajemen Pengguna',
      url: '/dashboard/admin/users',
      icon: UserCog,
    },
    {
      title: 'Manajemen Kelas',
      url: '/dashboard/admin/classroom',
      icon: School,
    },
    {
      title: 'Manajemen Kelompok',
      url: '/dashboard/admin/group',
      icon: UserGroupIcon,
    },
  ],
  teacher: [
    {
      title: 'Dashboard',
      url: '/dashboard/teacher',
      icon: LayoutDashboard,
    },
    {
      title: 'Data Diri',
      url: '/dashboard/teacher/profile',
      icon: User2Icon,
    },
    {
      title: 'Kelompok Bimbingan',
      url: '/dashboard/teacher/group',
      icon: Group,
    },
    {
      title: 'Setoran Siswa',
      url: '/dashboard/teacher/submission',
      icon: MonitorCogIcon,
      children: [
        {
          title: 'Input Setoran',
          url: '/dashboard/teacher/submission/input',
        },
        {
          title: 'Riwayat Setoran',
          url: '/dashboard/teacher/submission/history',
        },
      ],
    },
    {
      title: 'Tes Siswa',
      url: '/dashboard/teacher',
      icon: ClipboardPenLine,
      children: [
        {
          title: 'Daftar Tes',
          url: '/dashboard/teacher/exam/register',
        },
        {
          title: 'Jadwal Tes',
          url: '/dashboard/teacher/exam/schedule',
        },
        {
          title: 'Hasil Tes',
          url: '/dashboard/teacher/exam/result',
        },
      ],
    },
  ],
  student: [
    {
      title: 'Dashboard',
      url: '/dashboard/student',
      icon: LayoutDashboard,
    },
    {
      title: 'Data Diri',
      url: '/dashboard/student/profile',
      icon: User2Icon,
    },
    // {
    //   title: 'Kelas',
    //   url: '/dashboard/student/classroom',
    //   icon: School,
    // },
    // {
    //   title: 'Setoran Hafalan',
    //   url: '/dashboard/student/submission',
    //   icon: MonitorCogIcon,
    // },
  ],
};
