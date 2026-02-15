import { useDashboardContext } from "../context/DashboardContext";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, dispatch } = useDashboardContext();

  const handleThemeChange = (theme: "light" | "dark" | "auto") => {
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { theme },
    });
  };

  return (
    <div className="lgtm-modal-overlay" onClick={onClose}>
      <div className="lgtm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lgtm-modal__header">
          <h3 className="lgtm-modal__title">Settings</h3>
          <button className="lgtm-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="lgtm-modal__section">
          <label className="lgtm-modal__label">Theme</label>
          <div className="lgtm-modal__radio-group">
            <label className="lgtm-modal__radio-label">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={settings.theme === "light"}
                onChange={() => handleThemeChange("light")}
              />
              Light
            </label>
            <label className="lgtm-modal__radio-label">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={settings.theme === "dark"}
                onChange={() => handleThemeChange("dark")}
              />
              Dark
            </label>
            <label className="lgtm-modal__radio-label">
              <input
                type="radio"
                name="theme"
                value="auto"
                checked={settings.theme === "auto"}
                onChange={() => handleThemeChange("auto")}
              />
              System
            </label>
          </div>
        </div>

        <div className="lgtm-modal__actions">
          <button className="lgtm-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
