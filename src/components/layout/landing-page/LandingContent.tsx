export function LandingContent() {
  return (
    <main className="flex-1 min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 min-h-screen flex items-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-20 lg:py-32 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-6xl">
              Sistem Informasi{' '}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Monitoring Qur&apos;an
              </span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground lg:text-xl">
              Platform digital untuk memantau dan mengelola kegiatan tahfidz dan tahsin siswa SDIT
              Ulul Albab Mataram.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}