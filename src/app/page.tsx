import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <p>halaman awal</p>
      <Link href="/login">
        <Button type="submit">Login</Button>
      </Link>
    </>
  );
}
