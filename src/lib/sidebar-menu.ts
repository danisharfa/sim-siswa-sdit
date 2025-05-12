import {
  ClipboardList,
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
  ],
  coordinator: [
    {
      title: 'Dashboard',
      url: '/dashboard/coordinator',
      icon: LayoutDashboard,
    },
    {
      title: 'Data Diri',
      url: '/dashboard/coordinator/profile',
      icon: User2Icon,
    },
    {
      title: 'Manajemen Kelompok',
      url: '/dashboard/coordinator/group',
      icon: UserGroupIcon,
    },
    {
      title: 'Tashih',
      url: '/dashboard/coordinator/tashih',
      icon: ClipboardList,
      children: [
        {
          title: 'Permintaan',
          url: '/dashboard/coordinator/tashih/requests',
        },
        {
          title: 'Penjadwalan',
          url: '/dashboard/coordinator/tashih/schedules',
        },
        {
          title: 'Penilaian',
          url: '/dashboard/coordinator/tashih/results',
        },
      ],
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
      title: 'Tashih',
      url: '/dashboard/teacher',
      icon: ClipboardPenLine,
      children: [
        {
          title: 'Daftar',
          url: '/dashboard/teacher/tashih/request',
        },
        {
          title: 'Jadwal',
          url: '/dashboard/teacher/tashih/schedule',
        },
        {
          title: 'Hasil',
          url: '/dashboard/teacher/tashih/result',
        },
      ],
    },
    {
      title: 'Penilaian',
      // url: '/dashboard/teacher/group',
      // icon: MonitorCogIcon,
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
    {
      title: 'Aktifitas Rumah',
      // url: '/dashboard/student/homeActivity',
      icon: School,
    },
    // {
    //   title: 'Setoran Hafalan',
    //   url: '/dashboard/student/submission',
    //   icon: MonitorCogIcon,
    // },
  ],
};
