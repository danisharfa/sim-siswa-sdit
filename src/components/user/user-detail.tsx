import { getUserDetail } from '@/lib/data';

export default async function UserDetail({ userId }: { userId: string }) {
  const user = await getUserDetail(userId);

  if (!user) return <p>User not found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        {user.namaLengkap} ({user.role === 'student' ? 'Siswa' : 'Guru'})
      </h1>
      {user.role === 'student' ? (
        <>
          <p>
            <strong>NIS:</strong> {user.nis}
          </p>
          <p>
            <strong>Kelas:</strong> {user.kelas}
          </p>
        </>
      ) : (
        <>
          <p>
            <strong>NIP:</strong> {user.nip || 'Tidak tersedia'}
          </p>
        </>
      )}
      <p>
        <strong>Jenis Kelamin:</strong> {user.jenisKelamin}
      </p>
      <p>
        <strong>Tanggal Lahir:</strong>{' '}
        {user.tanggalLahir
          ? new Date(user.tanggalLahir).toLocaleDateString()
          : 'Tanggal lahir tidak tersedia'}
      </p>
    </div>
  );
}
