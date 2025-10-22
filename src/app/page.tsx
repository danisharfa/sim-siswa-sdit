import Link from 'next/link';
import Image from 'next/image';
import { LoginForm } from '@/components/layout/login/LoginForm';

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Side - Login Form */}
      <div className="flex flex-col gap-4 p-4 md:p-10">
        <div>
          <Link href="/" className="flex items-center gap-3 font-medium">
            <div className="relative flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 p-1">
              <Image
                src="/logo-sekolah.png"
                alt="Logo SDIT Ulul Albab"
                width={32}
                height={32}
                className="rounded-md"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                SIM-Qur&apos;an
              </span>
              <span className="text-xs text-muted-foreground">SDIT Ulul Albab Mataram</span>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-4">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">Selamat Datang</h1>
              <p className="text-muted-foreground">Masuk untuk mengakses SIM-Qur&apos;an</p>
            </div>

            <LoginForm />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">Butuh bantuan? Hubungi admin sekolah</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Copyright &copy; 2025 SDIT Ulul Albab Mataram. All Rights Reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div className="relative hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background lg:block">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="relative flex h-full flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-4">
            <div className="mx-auto flex items-center justify-center gap-3">
              <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm">
                <Image
                  src="/logo-sekolah.png"
                  alt="Logo SDIT Ulul Albab"
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              </div>
              <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm">
                <Image
                  src="/logo-yayasan.png"
                  alt="Logo Yayasan"
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">
                Sistem Informasi Monitoring Al-Qur&apos;an
              </h2>
              <p className="text-muted-foreground">
                Platform digital terpadu untuk monitoring dan pengelolaan kegiatan tahfidz dan
                tahsin di SDIT Ulul Albab Mataram.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/20">
                  <div className="size-2 rounded-full bg-primary" />
                </div>
                <span>Monitoring progress hafalan real-time</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/20">
                  <div className="size-2 rounded-full bg-primary" />
                </div>
                <span>Manajemen data siswa dan guru</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/20">
                  <div className="size-2 rounded-full bg-primary" />
                </div>
                <span>Rekap laporan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 size-20 rounded-full bg-primary/5 blur-xl" />
        <div className="absolute bottom-10 left-10 size-32 rounded-full bg-primary/5 blur-xl" />
      </div>
    </div>
  );
}
