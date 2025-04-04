export async function getClientUser() {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('Failed to fetch user');
    return await res.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}
