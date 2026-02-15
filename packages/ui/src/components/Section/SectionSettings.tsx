import { useState } from "react";
import type { SectionConfig } from "../../types";
import { useDashboardContext } from "../../context/DashboardContext";

interface SectionSettingsProps {
  section: SectionConfig;
  onClose: () => void;
}

export function SectionSettings({ section, onClose }: SectionSettingsProps) {
  const { dispatch } = useDashboardContext();
  const [title, setTitle] = useState(section.title);
  const [query, setQuery] = useState(section.query);

  const handleSave = () => {
    dispatch({
      type: "UPDATE_SECTION",
      payload: {
        id: section.id,
        updates: { title, query },
      },
    });
    onClose();
  };

  const handleDelete = () => {
    dispatch({
      type: "DELETE_SECTION",
      payload: { id: section.id },
    });
    onClose();
  };

  return (
    <div className="lgtm-modal-overlay" onClick={onClose}>
      <div className="lgtm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lgtm-modal__header">
          <h3 className="lgtm-modal__title">Section Settings</h3>
          <button className="lgtm-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="lgtm-modal__section">
          <label className="lgtm-modal__label" htmlFor="section-title">
            Title
          </label>
          <input
            id="section-title"
            className="lgtm-modal__input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="lgtm-modal__section">
          <label className="lgtm-modal__label" htmlFor="section-query">
            Query
          </label>
          <textarea
            id="section-query"
            className="lgtm-modal__textarea"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
          />
        </div>

        <div className="lgtm-modal__actions">
          <button
            className="lgtm-btn lgtm-btn--danger lgtm-modal__delete"
            onClick={handleDelete}
          >
            Delete Section
          </button>
          <button className="lgtm-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="lgtm-btn lgtm-btn--primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
