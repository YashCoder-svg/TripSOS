import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { addSessionExpiredListener, setAccessToken } from '../services/apiClient';
import { authService, type Credentials, type Registration } from '../services/authService';
import type { User } from '../types/user';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  sessionMessage: string | null;
  login(input: Credentials): Promise<void>;
  register(input: Registration): Promise<void>;
  logout(): Promise<void>;
  updateUser(user: User): void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const removeListener = addSessionExpiredListener(() => {
      setUser(null);
      setStatus('unauthenticated');
      setSessionMessage('Your session has ended. Sign in again to continue.');
    });
    void authService
      .restoreSession()
      .then((session) => {
        if (!active) return;
        if (session.authenticated) {
          setUser(session.user);
          setStatus('authenticated');
        } else {
          setUser(null);
          setStatus('unauthenticated');
        }
      })
      .catch(() => {
        setAccessToken(null);
        if (active) {
          setUser(null);
          setStatus('unauthenticated');
        }
      });
    return () => {
      active = false;
      removeListener();
    };
  }, []);

  const login = useCallback(async (input: Credentials) => {
    const nextUser = await authService.login(input);
    setUser(nextUser);
    setSessionMessage(null);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (input: Registration) => {
    const nextUser = await authService.register(input);
    setUser(nextUser);
    setSessionMessage(null);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // The local session still clears if the API cannot be reached.
    } finally {
      setAccessToken(null);
      setUser(null);
      setSessionMessage(null);
      setStatus('unauthenticated');
    }
  }, []);

  const updateUser = useCallback((nextUser: User) => setUser(nextUser), []);
  const value = useMemo(
    () => ({ status, user, sessionMessage, login, register, logout, updateUser }),
    [status, user, sessionMessage, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}
