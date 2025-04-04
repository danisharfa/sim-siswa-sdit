import {
  LayoutDashboardIcon,
  MonitorCogIcon,
  School,
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
      title: 'Monitoring Setoran',
      url: '/dashboard/admin/monitoring',
      icon: MonitorCogIcon,
    },
  ],
  teacher: [
    {
      title: 'Guru',
      url: '/dashboard/teacher',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Data Siswa',
      url: '/dashboard/teacher/students',
      icon: UsersRoundIcon,
    },
    {
      title: 'Rekap Setoran',
      url: '/dashboard/teacher/recap',
      icon: MonitorCogIcon,
    },
  ],
  student: [
    {
      title: 'Siswa',
      url: '/dashboard/student',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Setoran Saya',
      url: '/dashboard/student/submission',
      icon: MonitorCogIcon,
    },
  ],
};
