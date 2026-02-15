import { createRoot } from "react-dom/client";
import { LGTM } from "@lgtm/ui";
import type { StorageAdapter, AuthAdapter } from "@lgtm/ui";

const STORAGE_KEY = "lgtm-dashboard";
const TOKEN_KEY = "lgtm-github-token";

const storageAdapter: StorageAdapter = {
  async load() {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : null;
  },
  async save(dashboard) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboard));
  },
  onChange(cb) {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        cb(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};

const authAdapter: AuthAdapter = {
  async getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  async setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  async clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
  onTokenChange(cb) {
    const handler = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        cb(e.newValue);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};

const currentUser = localStorage.getItem("lgtm-username") || "octocat";

function App() {
  return (
    <LGTM
      adapters={{ storage: storageAdapter, auth: authAdapter }}
      currentUser={currentUser}
    />
  );
}

createRoot(document.getElementById("root")!).render(<App />);
