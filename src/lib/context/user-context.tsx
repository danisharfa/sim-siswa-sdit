'use client';

import { createContext, useContext } from 'react';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

const UserContext = createContext<User | null>(null);

export function UserContextProvider({ user, children }: { user: User; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserContextProvider');
  }
  return context;
}
