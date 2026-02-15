import { createContext, useContext, type ReactNode } from "react";

const CurrentUserContext = createContext<string>("");

interface CurrentUserProviderProps {
  currentUser: string;
  children: ReactNode;
}

export function CurrentUserProvider({
  currentUser,
  children,
}: CurrentUserProviderProps) {
  return (
    <CurrentUserContext.Provider value={currentUser}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): string {
  return useContext(CurrentUserContext);
}
