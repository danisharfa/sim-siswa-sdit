'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  return (
    <form action="/auth/signin" method="post" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Masuk</h1>
        <p className="text-muted-foreground text-sm">Logo sekolah bisa disini</p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="username">Nama akun</Label>
          <Input id="username" name="username" type="text" required />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Kata sandi</Label>
            <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
              Lupa kata sandi Anda?
            </a>
          </div>
          <Input id="password" name="password" type="password" required />
        </div>
        <Button type="submit" className="w-full">
          Masuk
        </Button>
      </div>
      <input type="hidden" name="callbackUrl" value="/dashboard" />
    </form>
  );
}

// 'use client';

// import { useEffect, useActionState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { toast } from 'sonner';
// import { logInCredentials } from '@/lib/actions';

// export function LoginForm() {
//   const router = useRouter();
//   const [state, formAction] = useActionState(logInCredentials, null);

//   useEffect(() => {
//     if (!state) return;

//     if (state.success) {
//       toast.success('Berhasil login 🎉');
//       router.replace('/dashboard');
//     }

//     if (state.error) {
//       const firstError = Object.values(state.error)[0]?.[0];
//       toast.error(firstError || 'Login gagal');
//     }

//     if (state.message && !state.success) {
//       toast.error(state.message);
//     }
//   }, [state, router]);

//   return (
//     <form action={formAction} className="flex flex-col gap-6">
//       <div className="flex flex-col items-center gap-2 text-center">
//         <h1 className="text-2xl font-bold">Masuk</h1>
//         <p className="text-muted-foreground text-sm">Logo sekolah bisa disini</p>
//       </div>
//       <div className="grid gap-6">
//         <div className="grid gap-3">
//           <Label htmlFor="username">Nama akun</Label>
//           <Input id="username" name="username" type="text" required />
//         </div>
//         <div className="grid gap-3">
//           <div className="flex items-center">
//             <Label htmlFor="password">Kata sandi</Label>
//             <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
//               Lupa kata sandi Anda?
//             </a>
//           </div>
//           <Input id="password" name="password" type="password" required />
//         </div>
//         <Button type="submit" className="w-full">
//           Masuk
//         </Button>
//       </div>
//     </form>
//   );
// }
