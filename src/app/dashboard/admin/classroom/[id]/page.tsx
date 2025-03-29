'use client';

import { useParams } from 'next/navigation';
import ClassroomDetails from '@/components/classroom/classroom-details';

export default function ClassroomPage() {
  const { id } = useParams();

  if (!id || typeof id !== 'string') return <p>Invalid class ID</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Detail Kelas: {id}</h1>
      <ClassroomDetails kelasId={id} />
    </div>
  );
}
