import type { StorageAdapter, AuthAdapter } from "../types";
import { AdapterProvider } from "../context/AdapterContext";
import { AuthProvider } from "../context/AuthProvider";
import { DashboardProvider } from "../context/DashboardContext";
import { UnreadProvider } from "../context/UnreadContext";
import { CurrentUserProvider } from "../context/CurrentUserContext";
import { ErrorBoundary } from "./ErrorBoundary";
import { AuthGate } from "./AuthGate";
import { PRDashboard } from "./PRDashboard";
import { ThemeWrapper } from "./ThemeWrapper";
import "../styles/dashboard.css";

export interface LGTMProps {
  adapters: {
    storage: StorageAdapter;
    auth: AuthAdapter;
  };
  currentUser: string;
  onError?: (error: Error) => void;
}

export function LGTM({ adapters, currentUser, onError }: LGTMProps) {
  return (
    <AdapterProvider storage={adapters.storage} auth={adapters.auth}>
      <AuthProvider>
        <DashboardProvider>
          <UnreadProvider>
            <CurrentUserProvider currentUser={currentUser}>
              <ErrorBoundary onError={onError}>
                <ThemeWrapper>
                  <AuthGate>
                    <PRDashboard />
                  </AuthGate>
                </ThemeWrapper>
              </ErrorBoundary>
            </CurrentUserProvider>
          </UnreadProvider>
        </DashboardProvider>
      </AuthProvider>
    </AdapterProvider>
  );
}
