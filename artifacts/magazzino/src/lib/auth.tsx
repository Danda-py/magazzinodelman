import { createContext, useContext, ReactNode } from 'react';
import { useGetMe, getGetMeQueryKey, AuthUser } from '@workspace/api-client-react';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } });

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
