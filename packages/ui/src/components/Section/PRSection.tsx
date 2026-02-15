import { useCallback } from "react";
import type { SectionConfig, SortField } from "../../types";
import { useSectionData } from "../../hooks/useSectionData";
import { useSortedPRs } from "../../hooks/useSortedPRs";
import { useDashboardContext } from "../../context/DashboardContext";
import { useCurrentUser } from "../../context/CurrentUserContext";
import { SectionHeader } from "./SectionHeader";
import { ColumnHeaders } from "./ColumnHeaders";
import { PRRow } from "../PRRow";
import { Spinner } from "../common/Spinner";
import { EmptyState } from "../common/EmptyState";

interface PRSectionProps {
  config: SectionConfig;
}

export function PRSection({ config }: PRSectionProps) {
  const currentUser = useCurrentUser();
  const { dispatch } = useDashboardContext();
  const { prs, totalCount, isLoading, error, refresh } = useSectionData(
    config,
    currentUser
  );
  const sortedPRs = useSortedPRs(prs, config.sort);

  const handleToggleCollapse = useCallback(() => {
    dispatch({
      type: "UPDATE_SECTION",
      payload: {
        id: config.id,
        updates: { collapsed: !config.collapsed },
      },
    });
  }, [dispatch, config.id, config.collapsed]);

  const handleSortChange = useCallback(
    (field: SortField) => {
      const direction =
        config.sort.field === field && config.sort.direction === "desc"
          ? "asc"
          : "desc";
      dispatch({
        type: "UPDATE_SECTION",
        payload: {
          id: config.id,
          updates: { sort: { field, direction } },
        },
      });
    },
    [dispatch, config.id, config.sort]
  );

  return (
    <div className="lgtm-section">
      <SectionHeader
        title={config.title}
        count={totalCount}
        collapsed={config.collapsed}
        onToggleCollapse={handleToggleCollapse}
        sort={config.sort}
        onSortChange={handleSortChange}
        onRefresh={refresh}
        isLoading={isLoading}
      />

      {!config.collapsed && (
        <>
          {isLoading && prs.length === 0 ? (
            <div className="lgtm-section__loading">
              <Spinner />
            </div>
          ) : error ? (
            <div className="lgtm-section__error">
              <span>{error.message}</span>
              <button className="lgtm-section__error-btn" onClick={refresh}>
                Retry
              </button>
            </div>
          ) : sortedPRs.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <ColumnHeaders sort={config.sort} onSortChange={handleSortChange} />
              {sortedPRs.map((pr) => (
                <PRRow key={pr.id} pr={pr} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
