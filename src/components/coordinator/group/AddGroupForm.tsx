'use client';

import useSWR from 'swr';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddGroupSchema, AddGroupInput } from '@/lib/validations/group';
import { toast } from 'sonner';
import { Semester } from '@prisma/client';

interface ActiveClassroom {
  id: string;
  name: string;
  academicYear: string;
  semester: Semester;
}

interface Props {
  onGroupAdded: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AddGroupForm({ onGroupAdded }: Props) {
  const form = useForm<AddGroupInput>({
    resolver: zodResolver(AddGroupSchema),
    defaultValues: {
      groupName: '',
      classroomName: '',
      classroomAcademicYear: '',
      classroomSemester: 'GANJIL',
      nip: '',
    },
  });

  const { data } = useSWR('/api/coordinator/classroom/active', fetcher);
  const classroomOptions: ActiveClassroom[] = data?.data || [];

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: AddGroupInput) {
    try {
      const res = await fetch('/api/coordinator/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result.message || 'Gagal menambah kelompok');
        return;
      }

      toast.success(result.message || 'Kelompok berhasil ditambahkan');
      form.reset();
      onGroupAdded();
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan data');
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Tambah Kelompok Baru</h2>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="groupName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kelompok</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Kelompok 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classroomName"
              render={() => (
                <FormItem>
                  <FormLabel>Kelas Aktif</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const selected = classroomOptions.find(
                        (c: ActiveClassroom) => c.id === value
                      );
                      if (selected) {
                        form.setValue('classroomName', selected.name);
                        form.setValue('classroomAcademicYear', selected.academicYear);
                        form.setValue('classroomSemester', selected.semester);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas aktif" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classroomOptions.map((kelas) => (
                        <SelectItem key={kelas.id} value={kelas.id}>
                          {kelas.name} - {kelas.academicYear} {kelas.semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIP Wali Kelompok</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menambahkan...' : 'Tambah Kelompok'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
