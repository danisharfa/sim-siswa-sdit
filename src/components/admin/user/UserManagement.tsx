'use client';

import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { AddUserForm } from '@/components/admin/user/AddUserForm';
import { UserTable } from '@/components/admin/user/UserTable';
import { Role } from '@prisma/client';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  graduatedAt?: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function UserManagement() {
  const { data, isLoading, mutate } = useSWR('/api/admin/user', fetcher);

  const users = data?.data ?? [];

  const coordinator: User[] = users.filter((user: User) => user.role === Role.coordinator);
  const teachers: User[] = users.filter((user: User) => user.role === Role.teacher);
  const students: User[] = users.filter((user: User) => user.role === Role.student);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-70 w-full" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AddUserForm onUserAdded={mutate} />
      <UserTable data={coordinator} title="Daftar Koordinator" onRefresh={mutate} />
      <UserTable data={teachers} title="Daftar Guru" onRefresh={mutate} />
      <UserTable data={students} title="Daftar Siswa" onRefresh={mutate} />
    </div>
  );
}
