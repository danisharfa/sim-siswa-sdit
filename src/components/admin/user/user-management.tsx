'use client';

import { useEffect, useState } from 'react';
import { AddUserForm } from '@/components/admin/user/add-user-form';
import { UserTable } from '@/components/admin/user/user-table';

interface User {
  id: string;
  username: string;
  namaLengkap: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);

  async function fetchUsers() {
    const res = await fetch('/api/users', {
      method: 'GET',
    });
    const data = await res.json();
    setUsers(data);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const teachers = users.filter((user) => user.role === 'teacher');
  const students = users.filter((user) => user.role === 'student');

  return (
    <div className="space-y-6">
      <AddUserForm onUserAdded={fetchUsers} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserTable data={teachers} title="Daftar Guru" onRefresh={fetchUsers} />
        <UserTable data={students} title="Daftar Siswa" onRefresh={fetchUsers} />
      </div>
    </div>
  );
}
