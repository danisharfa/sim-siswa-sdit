import Link from 'next/link';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  href: string;
}

export function BackButton({ href }: BackButtonProps) {
  return (
    <Button asChild variant="outline" size="icon">
      <Link href={href}>
        <ArrowLeft />
      </Link>
    </Button>
  );
}
