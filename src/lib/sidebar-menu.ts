import {
  Group,
  GroupIcon,
  LayoutDashboardIcon,
  MonitorCogIcon,
  School,
  User2Icon,
  UsersRoundIcon,
} from 'lucide-react';

export const menuData = {
  admin: [
    {
      title: 'Dashboard',
      url: '/dashboard/admin',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Manajemen Pengguna',
      url: '/dashboard/admin/users',
      icon: UsersRoundIcon,
    },
    {
      title: 'Manajemen Kelas',
      url: '/dashboard/admin/classroom',
      icon: School,
    },
    {
      title: 'Manajemen Kelompok',
      url: '/dashboard/admin/group',
      icon: Group,
    },
    {
      title: 'Monitoring Setoran',
      url: '/dashboard/admin/monitoring',
      icon: MonitorCogIcon,
    },
  ],
  teacher: [
    {
      title: 'Dashboard',
      url: '/dashboard/teacher',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Data Diri',
      url: '/dashboard/teacher/profile',
      icon: User2Icon,
    },
    {
      title: 'Kelompok Bimbingan',
      url: '/dashboard/teacher/group',
      icon: GroupIcon,
    },
    {
      title: 'Setoran Hafalan',
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
  ],
  student: [
    {
      title: 'Dashboard',
      url: '/dashboard/student',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Data Diri',
      url: '/dashboard/student/profile',
      icon: User2Icon,
    },
    {
      title: 'Kelas',
      url: '/dashboard/student/classroom',
      icon: School,
    },
    {
      title: 'Setoran Hafalan',
      url: '/dashboard/student/submission',
      icon: MonitorCogIcon,
    },
  ],
};
