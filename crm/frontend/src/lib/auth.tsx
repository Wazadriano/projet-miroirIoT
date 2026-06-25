import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { api, setToken, getToken, setBoutiqueId } from './api';
import type { User } from './types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  role: string | null;
  isGerant: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken()) {
      api<User>('me')
        .then((u) => {
          setUser(u);
          setBoutiqueId('all');
        })
        .catch((err: unknown) => {
          // N'effacer le token QUE sur un vrai 401 (token invalide/révoqué).
          // Une erreur réseau ou 5xx ne doit pas déconnecter l'utilisateur.
          if (err instanceof Error && err.message === 'Non authentifié') {
            setToken(null);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api<{ token: string; user: User }>('login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    setUser(res.user);
    setBoutiqueId('all');
  };

  const logout = async () => {
    await api('logout', { method: 'POST' }).catch(() => { });
    setToken(null);
    setBoutiqueId(null);
    setUser(null);
  };

  // Role from user record directly
  const role = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        isGerant: role === 'gerant' || !!user?.is_admin,
        isAdmin: !!user?.is_admin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
