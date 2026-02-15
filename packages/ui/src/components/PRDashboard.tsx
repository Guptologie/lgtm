import { useState, useMemo } from "react";
import { useDashboardContext } from "../context/DashboardContext";
import { PRSection } from "./Section/PRSection";
import { SettingsModal } from "./SettingsModal";

export function PRDashboard() {
  const { sections } = useDashboardContext();
  const [showSettings, setShowSettings] = useState(false);

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.order - b.order),
    [sections]
  );

  return (
    <>
      <header className="lgtm-header">
        <h1 className="lgtm-header__title">LGTM</h1>
        <div className="lgtm-header__actions">
          <button
            className="lgtm-btn lgtm-btn--icon lgtm-btn--ghost"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            &#9881;
          </button>
        </div>
      </header>

      {sortedSections.map((section) => (
        <PRSection key={section.id} config={section} />
      ))}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
