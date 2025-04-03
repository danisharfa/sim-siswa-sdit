import { Button } from '@/components/ui/button';
import UserDetail from '@/components/user/user-detail';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Params = Promise<{ id: string }>;

export default async function UserPage(props: { params: Params }) {
  const params = await props.params;
  const id = params.id;

  return (
    <div className="p-4">
      <Link href="/dashboard/admin/users">
        <Button variant="ghost">
          <ArrowLeft />
        </Button>
      </Link>

      <UserDetail userId={id} />
    </div>
  );
}
