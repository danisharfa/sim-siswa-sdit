'use client';

import useSWR from 'swr';
import { ErrorState } from '@/components/layout/error/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { AddUserForm } from '@/components/admin/user/AddUserForm';
import { UserTable } from '@/components/admin/user/UserTable';

export type User = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  graduatedAt?: string | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function UserManagement() {
  const { data, error, isLoading, mutate } = useSWR('/api/admin/user', fetcher);

  const users = data?.data ?? [];

  const coordinator: User[] = users.filter((u: User) => u.role === 'coordinator');
  const teachers: User[] = users.filter((u: User) => u.role === 'teacher');
  const students: User[] = users.filter((u: User) => u.role === 'student');

  if (error) {
    return <ErrorState onRetry={() => mutate()} />;
  }

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
    <div className="space-y-4">
      <AddUserForm onUserAdded={mutate} />
      <UserTable data={coordinator} title="Daftar Koordinator" onRefresh={mutate} />
      <UserTable data={teachers} title="Daftar Guru" onRefresh={mutate} />
      <UserTable data={students} title="Daftar Siswa" onRefresh={mutate} />
    </div>
  );
}
