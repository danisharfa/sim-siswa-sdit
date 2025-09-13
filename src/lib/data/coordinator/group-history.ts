import { auth } from '@/auth';
import { Role } from '@prisma/client';

export async function fetchCoordinatorGroupHistoryMembers(groupId: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== Role.coordinator) {
      throw new Error('Unauthorized');
    }

    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/coordinator/group/${groupId}/history`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch group history members');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch group history members');
    }

    return data.data || [];
  } catch (error) {
    console.error('Error fetching coordinator group history members:', error);
    return [];
  }
}
