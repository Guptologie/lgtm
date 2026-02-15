import React, { useState, type ReactNode } from "react";
import { useAuthContext } from "../context/AuthProvider";
import { Spinner } from "./common/Spinner";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { token, isLoading, setToken } = useAuthContext();
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="lgtm-auth-gate__loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (token) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      await setToken(trimmed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="lgtm-auth-gate">
      <div className="lgtm-auth-gate__card">
        <h2 className="lgtm-auth-gate__title">Welcome to LGTM</h2>
        <p className="lgtm-auth-gate__desc">
          Connect your GitHub account to see your pull requests.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="lgtm-auth-gate__label" htmlFor="lgtm-token-input">
            GitHub Personal Access Token
          </label>
          <input
            id="lgtm-token-input"
            className="lgtm-auth-gate__input"
            type="password"
            placeholder="ghp_..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="lgtm-auth-gate__submit"
            type="submit"
            disabled={!inputValue.trim() || isSaving}
          >
            {isSaving ? "Saving..." : "Save Token"}
          </button>
        </form>

        <div className="lgtm-auth-gate__instructions">
          <strong>How to create a token:</strong>
          <ol>
            <li>
              Go to{" "}
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Token Settings
              </a>
            </li>
            <li>Select scopes: <code>repo</code>, <code>read:org</code>, <code>notifications</code></li>
            <li>Generate and paste the token above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
