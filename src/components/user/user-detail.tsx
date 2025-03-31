interface User {
  id: string;
  username: string;
  namaLengkap: string;
  role: string;
  createdAt: string;
  siswaProfile?: {
    nis: string;
    tempatLahir: string;
    tanggalLahir: string;
    jenisKelamin: string;
    golonganDarah?: string;
    agama?: string;
    alamat?: string;
    noTelp?: string;
  };
  guruProfile?: {
    nip?: string;
    tempatLahir: string;
    tanggalLahir: string;
    jenisKelamin: string;
    golonganDarah?: string;
    agama?: string;
    alamat?: string;
    noTelp?: string;
  };
}

export function UserDetail({ user }: { user: User }) {
  return (
    <div className="bg-white shadow-md rounded-md p-6">
      <h2 className="text-lg font-semibold mb-2">Informasi Pengguna</h2>
      <p>
        <strong>Username:</strong> {user.username}
      </p>
      <p>
        <strong>Nama Lengkap:</strong> {user.namaLengkap}
      </p>
      <p>
        <strong>Role:</strong> {user.role}
      </p>
      <p>
        <strong>Tanggal Dibuat:</strong>{' '}
        {new Date(user.createdAt).toLocaleDateString()}
      </p>

      {user.role === 'student' && user.siswaProfile && (
        <>
          <h2 className="text-lg font-semibold mt-4">Profil Siswa</h2>
          <p>
            <strong>NIS:</strong> {user.siswaProfile.nis}
          </p>
          <p>
            <strong>Tempat & Tanggal Lahir:</strong>{' '}
            {user.siswaProfile.tempatLahir},{' '}
            {new Date(user.siswaProfile.tanggalLahir).toLocaleDateString()}
          </p>
          <p>
            <strong>Jenis Kelamin:</strong> {user.siswaProfile.jenisKelamin}
          </p>
          {user.siswaProfile.golonganDarah && (
            <p>
              <strong>Golongan Darah:</strong> {user.siswaProfile.golonganDarah}
            </p>
          )}
          {user.siswaProfile.agama && (
            <p>
              <strong>Agama:</strong> {user.siswaProfile.agama}
            </p>
          )}
          {user.siswaProfile.alamat && (
            <p>
              <strong>Alamat:</strong> {user.siswaProfile.alamat}
            </p>
          )}
          {user.siswaProfile.noTelp && (
            <p>
              <strong>No. Telepon:</strong> {user.siswaProfile.noTelp}
            </p>
          )}
        </>
      )}

      {user.role === 'teacher' && user.guruProfile && (
        <>
          <h2 className="text-lg font-semibold mt-4">Profil Guru</h2>
          {user.guruProfile.nip && (
            <p>
              <strong>NIP:</strong> {user.guruProfile.nip}
            </p>
          )}
          <p>
            <strong>Tempat & Tanggal Lahir:</strong>{' '}
            {user.guruProfile.tempatLahir},{' '}
            {new Date(user.guruProfile.tanggalLahir).toLocaleDateString()}
          </p>
          <p>
            <strong>Jenis Kelamin:</strong> {user.guruProfile.jenisKelamin}
          </p>
          {user.guruProfile.golonganDarah && (
            <p>
              <strong>Golongan Darah:</strong> {user.guruProfile.golonganDarah}
            </p>
          )}
          {user.guruProfile.agama && (
            <p>
              <strong>Agama:</strong> {user.guruProfile.agama}
            </p>
          )}
          {user.guruProfile.alamat && (
            <p>
              <strong>Alamat:</strong> {user.guruProfile.alamat}
            </p>
          )}
          {user.guruProfile.noTelp && (
            <p>
              <strong>No. Telepon:</strong> {user.guruProfile.noTelp}
            </p>
          )}
        </>
      )}
    </div>
  );
}
