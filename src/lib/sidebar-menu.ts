import {
  BookOpenIcon,
  ClipboardPenLine,
  LayoutDashboard,
  NotebookIcon,
  User2Icon,
  UserCog,
} from 'lucide-react';
import { FaChalkboard } from 'react-icons/fa';
import { FaUsersGear } from 'react-icons/fa6';
import { ImProfile } from 'react-icons/im';
import { MdHomeWork } from 'react-icons/md';
import { TbBookUpload } from 'react-icons/tb';
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import { GrDocumentConfig } from 'react-icons/gr';

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
      icon: FaChalkboard,
    },
    {
      title: 'Konfigurasi & Referensi Data',
      url: '/dashboard/admin/configuration',
      icon: GrDocumentConfig,
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
      icon: ImProfile,
    },
    {
      title: 'Manajemen Kelompok',
      url: '/dashboard/coordinator/group',
      icon: FaUsersGear,
    },
    {
      title: 'Tashih',
      icon: ClipboardPenLine,
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
      icon: ImProfile,
    },
    {
      title: 'Kelompok Bimbingan',
      url: '/dashboard/teacher/group',
      icon: FaUsersGear,
    },
    {
      title: 'Setoran Siswa',
      icon: TbBookUpload,
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
    // {
    //   title: 'Penilaian',
    //   url: '/dashboard/teacher/avaluation',
    //   icon: HiOutlineClipboardDocumentList,
    // },
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
    //   title: 'Aktifitas Rumah',
    //   url: '/dashboard/student/homeActivity',
    //   icon: MdHomeWork,
    // },
    {
      title: 'Riwayat Setoran',
      url: '/dashboard/student/submission',
      icon: BookOpenIcon,
    },
    {
      title: 'Nilai',
      url: '/dashboard/student/score',
      icon: NotebookIcon,
    },
  ],
};
