'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface Siswa {
  id: string;
  nis: string;
  namaLengkap: string;
}

interface Guru {
  id: string;
  nip: string | null;
  namaLengkap: string;
}

interface Props {
  guruList: Guru[];
  siswaList: Siswa[];
}

export function ClassroomDetails({ guruList, siswaList }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Guru Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Daftar Guru</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2 px-4">No</th>
                  <th className="py-2 px-4">NIP</th>
                  <th className="py-2 px-4">Nama</th>
                </tr>
              </thead>
              <tbody>
                {guruList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-2 px-4 text-center">
                      Belum ada guru.
                    </td>
                  </tr>
                ) : (
                  guruList.map((guru, index) => (
                    <tr key={guru.id} className="border-t">
                      <td className="py-2 px-4">{index + 1}</td>
                      <td className="py-2 px-4">{guru.nip || '-'}</td>
                      <td className="py-2 px-4">{guru.namaLengkap}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Siswa Table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Daftar Siswa</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2 px-4">No</th>
                  <th className="py-2 px-4">NIS</th>
                  <th className="py-2 px-4">Nama</th>
                </tr>
              </thead>
              <tbody>
                {siswaList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-2 px-4 text-center">
                      Belum ada siswa.
                    </td>
                  </tr>
                ) : (
                  siswaList.map((siswa, index) => (
                    <tr key={siswa.id} className="border-t">
                      <td className="py-2 px-4">{index + 1}</td>
                      <td className="py-2 px-4">{siswa.nis}</td>
                      <td className="py-2 px-4">{siswa.namaLengkap}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
