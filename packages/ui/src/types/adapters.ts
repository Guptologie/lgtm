import type { SerializedDashboard } from "./dashboard";

export interface StorageAdapter {
  load(): Promise<SerializedDashboard | null>;
  save(dashboard: SerializedDashboard): Promise<void>;
  onChange(callback: (dashboard: SerializedDashboard) => void): () => void;
}

export interface AuthAdapter {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
  onTokenChange(callback: (token: string | null) => void): () => void;
}
