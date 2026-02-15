import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAdapters } from "./AdapterContext";

interface AuthContextValue {
  token: string | null;
  isLoading: boolean;
  setToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { auth } = useAdapters();
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    auth.getToken().then((t) => {
      if (!cancelled) {
        setTokenState(t);
        setIsLoading(false);
      }
    });

    const unsubscribe = auth.onTokenChange((t) => {
      if (!cancelled) {
        setTokenState(t);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [auth]);

  const setToken = useCallback(
    async (newToken: string) => {
      await auth.setToken(newToken);
      setTokenState(newToken);
    },
    [auth]
  );

  const clearToken = useCallback(async () => {
    await auth.clearToken();
    setTokenState(null);
  }, [auth]);

  return (
    <AuthContext.Provider value={{ token, isLoading, setToken, clearToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
