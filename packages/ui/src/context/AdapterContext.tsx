import { createContext, useContext, type ReactNode } from "react";
import type { StorageAdapter, AuthAdapter } from "../types";

interface AdapterContextValue {
  storage: StorageAdapter;
  auth: AuthAdapter;
}

const AdapterContext = createContext<AdapterContextValue | null>(null);

interface AdapterProviderProps {
  storage: StorageAdapter;
  auth: AuthAdapter;
  children: ReactNode;
}

export function AdapterProvider({
  storage,
  auth,
  children,
}: AdapterProviderProps) {
  return (
    <AdapterContext.Provider value={{ storage, auth }}>
      {children}
    </AdapterContext.Provider>
  );
}

export function useAdapters(): AdapterContextValue {
  const context = useContext(AdapterContext);
  if (!context) {
    throw new Error("useAdapters must be used within an AdapterProvider");
  }
  return context;
}
