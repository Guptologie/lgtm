// src/context/AdapterContext.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var AdapterContext = createContext(null);
function AdapterProvider({
  storage,
  auth,
  children
}) {
  return /* @__PURE__ */ jsx(AdapterContext.Provider, { value: { storage, auth }, children });
}
function useAdapters() {
  const context = useContext(AdapterContext);
  if (!context) {
    throw new Error("useAdapters must be used within an AdapterProvider");
  }
  return context;
}

// src/context/AuthProvider.tsx
import {
  createContext as createContext2,
  useContext as useContext2,
  useState,
  useEffect,
  useCallback
} from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var AuthContext = createContext2(null);
function AuthProvider({ children }) {
  const { auth } = useAdapters();
  const [token, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    auth.getToken().then((t) => {
      if (!cancelled) {
        setTokenState(t);
        setIsLoading(false);
      }
    });
    const unsubscribe = auth.onTokenChange((t) => {
      if (!cancelled) {
        setTokenState(t);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [auth]);
  const setToken = useCallback(
    async (newToken) => {
      await auth.setToken(newToken);
      setTokenState(newToken);
    },
    [auth]
  );
  const clearToken = useCallback(async () => {
    await auth.clearToken();
    setTokenState(null);
  }, [auth]);
  return /* @__PURE__ */ jsx2(AuthContext.Provider, { value: { token, isLoading, setToken, clearToken }, children });
}
function useAuthContext() {
  const context = useContext2(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

// src/context/DashboardContext.tsx
import {
  createContext as createContext3,
  useContext as useContext3,
  useReducer,
  useEffect as useEffect2,
  useRef
} from "react";

// src/defaults/default-sections.ts
var PR_FIELDS = `
  ... on PullRequest {
    id
    number
    title
    url
    repository { nameWithOwner }
    author { login avatarUrl }
    additions
    deletions
    changedFiles
    reviewDecision
    isDraft
    state
    mergeable
    createdAt
    updatedAt
    labels(first: 10) { nodes { name color } }
    reviews(last: 10) { nodes { author { login avatarUrl } state } }
    latestReviews(first: 10) { nodes { author { login avatarUrl } state } }
    commits(last: 1) {
      nodes {
        commit {
          statusCheckRollup {
            contexts(first: 50) {
              nodes {
                ... on CheckRun { name conclusion status }
                ... on StatusContext { context state }
              }
            }
          }
        }
      }
    }
  }
`;
function buildQuery(searchQuery) {
  return `query {
  search(query: "${searchQuery}", type: ISSUE, first: 25) {
    issueCount
    edges {
      node {
        ${PR_FIELDS}
      }
    }
  }
}`;
}
var defaultSections = [
  {
    id: "needs-your-review",
    title: "Needs your review",
    query: buildQuery(
      "is:pr is:open review-requested:{currentUser} archived:false"
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: false,
    order: 0
  },
  {
    id: "returned-to-you",
    title: "Returned to you",
    query: buildQuery(
      "is:pr is:open author:{currentUser} review:approved archived:false"
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: false,
    order: 1
  },
  {
    id: "approved",
    title: "Approved",
    query: buildQuery(
      "is:pr is:open author:{currentUser} review:approved archived:false"
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: false,
    order: 2
  },
  {
    id: "waiting-for-reviewers",
    title: "Waiting for reviewers",
    query: buildQuery(
      "is:pr is:open author:{currentUser} review:required archived:false"
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: false,
    order: 3
  },
  {
    id: "drafts",
    title: "Drafts",
    query: buildQuery(
      "is:pr is:open author:{currentUser} draft:true archived:false"
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: true,
    order: 4
  },
  {
    id: "waiting-for-author",
    title: "Waiting for author",
    query: buildQuery(
      "is:pr is:open review-requested:{currentUser} review:changes_requested archived:false"
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: true,
    order: 5
  },
  {
    id: "recently-merged",
    title: "Recently merged",
    query: buildQuery(
      "is:pr is:merged author:{currentUser} archived:false sort:updated-desc"
    ),
    sort: { field: "updated", direction: "desc" },
    collapsed: true,
    order: 6
  }
];

// src/context/DashboardContext.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
var defaultSettings = {
  theme: "auto"
};
function dashboardReducer(state, action) {
  switch (action.type) {
    case "ADD_SECTION":
      return {
        ...state,
        sections: [...state.sections, action.payload]
      };
    case "UPDATE_SECTION":
      return {
        ...state,
        sections: state.sections.map(
          (s) => s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
        )
      };
    case "DELETE_SECTION":
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== action.payload.id)
      };
    case "REORDER_SECTIONS": {
      const orderMap = new Map(
        action.payload.sectionIds.map((id, index) => [id, index])
      );
      return {
        ...state,
        sections: state.sections.map((s) => ({
          ...s,
          order: orderMap.get(s.id) ?? s.order
        })).sort((a, b) => a.order - b.order)
      };
    }
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    case "LOAD":
      return action.payload;
    default:
      return state;
  }
}
var DashboardContext = createContext3(null);
function DashboardProvider({ children }) {
  const { storage } = useAdapters();
  const [state, dispatch] = useReducer(dashboardReducer, {
    sections: [],
    settings: defaultSettings
  });
  const initialLoadDone = useRef(false);
  const saveTimeoutRef = useRef();
  useEffect2(() => {
    storage.load().then((saved) => {
      if (saved) {
        dispatch({
          type: "LOAD",
          payload: {
            sections: saved.sections,
            settings: saved.settings
          }
        });
      } else {
        dispatch({
          type: "LOAD",
          payload: {
            sections: defaultSections,
            settings: defaultSettings
          }
        });
      }
      initialLoadDone.current = true;
    });
    const unsubscribe = storage.onChange((dashboard) => {
      dispatch({
        type: "LOAD",
        payload: {
          sections: dashboard.sections,
          settings: dashboard.settings
        }
      });
    });
    return () => {
      unsubscribe();
    };
  }, [storage]);
  useEffect2(() => {
    if (!initialLoadDone.current) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      storage.save({
        version: 1,
        sections: state.sections,
        settings: state.settings
      });
    }, 500);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, storage]);
  return /* @__PURE__ */ jsx3(
    DashboardContext.Provider,
    {
      value: {
        sections: state.sections,
        settings: state.settings,
        dispatch
      },
      children
    }
  );
}
function useDashboardContext() {
  const context = useContext3(DashboardContext);
  if (!context) {
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider"
    );
  }
  return context;
}

// src/context/UnreadContext.tsx
import {
  createContext as createContext4,
  useContext as useContext4,
  useState as useState2,
  useEffect as useEffect3,
  useCallback as useCallback2,
  useRef as useRef2
} from "react";
import { jsx as jsx4 } from "react/jsx-runtime";
var UnreadContext = createContext4(null);
var POLL_INTERVAL_MS = 6e4;
function UnreadProvider({ children }) {
  const { token } = useAuthContext();
  const [unreadUrls, setUnreadUrls] = useState2(/* @__PURE__ */ new Set());
  const intervalRef = useRef2();
  const fetchUnread = useCallback2(async () => {
    if (!token) {
      setUnreadUrls(/* @__PURE__ */ new Set());
      return;
    }
    try {
      const response = await fetch(
        "https://api.github.com/notifications?participating=true&all=false",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "lgtm-dashboard"
          }
        }
      );
      if (!response.ok) return;
      const notifications = await response.json();
      const urls = /* @__PURE__ */ new Set();
      for (const notification of notifications) {
        if (notification.unread && notification.subject.type === "PullRequest") {
          const htmlUrl = notification.subject.url.replace("https://api.github.com/repos/", "https://github.com/").replace("/pulls/", "/pull/");
          urls.add(htmlUrl);
        }
      }
      setUnreadUrls(urls);
    } catch {
    }
  }, [token]);
  const refresh = useCallback2(() => {
    fetchUnread();
  }, [fetchUnread]);
  useEffect3(() => {
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUnread]);
  return /* @__PURE__ */ jsx4(UnreadContext.Provider, { value: { unreadUrls, refresh }, children });
}
function useUnreadContext() {
  const context = useContext4(UnreadContext);
  if (!context) {
    throw new Error("useUnreadContext must be used within an UnreadProvider");
  }
  return context;
}

// src/context/CurrentUserContext.tsx
import { createContext as createContext5, useContext as useContext5 } from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
var CurrentUserContext = createContext5("");
function CurrentUserProvider({
  currentUser,
  children
}) {
  return /* @__PURE__ */ jsx5(CurrentUserContext.Provider, { value: currentUser, children });
}
function useCurrentUser() {
  return useContext5(CurrentUserContext);
}

// src/components/ErrorBoundary.tsx
import { Component } from "react";
import { jsx as jsx6, jsxs } from "react/jsx-runtime";
var ErrorBoundary = class extends Component {
  constructor(props) {
    super(props);
    this.handleRetry = () => {
      this.setState({ hasError: false, error: null });
    };
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[LGTM] Render error:", error, errorInfo);
    this.props.onError?.(error);
  }
  render() {
    if (this.state.hasError) {
      return /* @__PURE__ */ jsx6("div", { className: "lgtm-error-boundary", children: /* @__PURE__ */ jsxs("div", { className: "lgtm-error-boundary__card", children: [
        /* @__PURE__ */ jsx6("p", { className: "lgtm-error-boundary__title", children: "Something went wrong" }),
        /* @__PURE__ */ jsx6("p", { className: "lgtm-error-boundary__message", children: this.state.error?.message ?? "An unexpected error occurred." }),
        /* @__PURE__ */ jsx6(
          "button",
          {
            className: "lgtm-error-boundary__retry",
            onClick: this.handleRetry,
            children: "Retry"
          }
        )
      ] }) });
    }
    return this.props.children;
  }
};

// src/components/AuthGate.tsx
import { useState as useState3 } from "react";

// src/components/common/Spinner.tsx
import { jsx as jsx7 } from "react/jsx-runtime";
function Spinner({ size = "md" }) {
  const className = size === "sm" ? "lgtm-spinner lgtm-spinner--sm" : size === "lg" ? "lgtm-spinner lgtm-spinner--lg" : "lgtm-spinner";
  return /* @__PURE__ */ jsx7("span", { className, role: "status", "aria-label": "Loading" });
}

// src/components/AuthGate.tsx
import { Fragment, jsx as jsx8, jsxs as jsxs2 } from "react/jsx-runtime";
function AuthGate({ children }) {
  const { token, isLoading, setToken } = useAuthContext();
  const [inputValue, setInputValue] = useState3("");
  const [isSaving, setIsSaving] = useState3(false);
  if (isLoading) {
    return /* @__PURE__ */ jsx8("div", { className: "lgtm-auth-gate__loading", children: /* @__PURE__ */ jsx8(Spinner, { size: "lg" }) });
  }
  if (token) {
    return /* @__PURE__ */ jsx8(Fragment, { children });
  }
  const handleSubmit = async (e) => {
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
  return /* @__PURE__ */ jsx8("div", { className: "lgtm-auth-gate", children: /* @__PURE__ */ jsxs2("div", { className: "lgtm-auth-gate__card", children: [
    /* @__PURE__ */ jsx8("h2", { className: "lgtm-auth-gate__title", children: "Welcome to LGTM" }),
    /* @__PURE__ */ jsx8("p", { className: "lgtm-auth-gate__desc", children: "Connect your GitHub account to see your pull requests." }),
    /* @__PURE__ */ jsxs2("form", { onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsx8("label", { className: "lgtm-auth-gate__label", htmlFor: "lgtm-token-input", children: "GitHub Personal Access Token" }),
      /* @__PURE__ */ jsx8(
        "input",
        {
          id: "lgtm-token-input",
          className: "lgtm-auth-gate__input",
          type: "password",
          placeholder: "ghp_...",
          value: inputValue,
          onChange: (e) => setInputValue(e.target.value),
          autoComplete: "off",
          spellCheck: false
        }
      ),
      /* @__PURE__ */ jsx8(
        "button",
        {
          className: "lgtm-auth-gate__submit",
          type: "submit",
          disabled: !inputValue.trim() || isSaving,
          children: isSaving ? "Saving..." : "Save Token"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "lgtm-auth-gate__instructions", children: [
      /* @__PURE__ */ jsx8("strong", { children: "How to create a token:" }),
      /* @__PURE__ */ jsxs2("ol", { children: [
        /* @__PURE__ */ jsxs2("li", { children: [
          "Go to",
          " ",
          /* @__PURE__ */ jsx8(
            "a",
            {
              href: "https://github.com/settings/tokens/new",
              target: "_blank",
              rel: "noopener noreferrer",
              children: "GitHub Token Settings"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs2("li", { children: [
          "Select scopes: ",
          /* @__PURE__ */ jsx8("code", { children: "repo" }),
          ", ",
          /* @__PURE__ */ jsx8("code", { children: "read:org" }),
          ", ",
          /* @__PURE__ */ jsx8("code", { children: "notifications" })
        ] }),
        /* @__PURE__ */ jsx8("li", { children: "Generate and paste the token above" })
      ] })
    ] })
  ] }) });
}

// src/components/PRDashboard.tsx
import { useState as useState6, useMemo as useMemo2 } from "react";

// src/components/Section/PRSection.tsx
import { useCallback as useCallback4 } from "react";

// src/hooks/useSectionData.ts
import { useState as useState4, useEffect as useEffect4, useCallback as useCallback3, useRef as useRef3 } from "react";

// src/api/graphql-client.ts
async function executeQuery(query, token, variables) {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "lgtm-dashboard"
    },
    body: JSON.stringify({ query, variables })
  });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`);
  }
  return json.data;
}

// src/api/transforms.ts
function computeCIState(contexts) {
  if (contexts.length === 0) return "NONE";
  let hasPending = false;
  for (const ctx of contexts) {
    const conclusion = ctx.conclusion?.toUpperCase();
    const state = ctx.state?.toUpperCase() ?? ctx.status?.toUpperCase();
    if (conclusion === "FAILURE" || conclusion === "ERROR" || state === "FAILURE" || state === "ERROR") {
      return "FAILURE";
    }
    if (state === "PENDING" || state === "QUEUED" || state === "IN_PROGRESS" || conclusion === null) {
      hasPending = true;
    }
  }
  if (hasPending) return "PENDING";
  return "SUCCESS";
}
function extractRepo(url) {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
  return match ? match[1] : "";
}
function normalizePR(node) {
  const reviewNodes = node.reviews?.nodes ?? [];
  const reviewerMap = /* @__PURE__ */ new Map();
  for (const review of reviewNodes) {
    if (!review.author?.login) continue;
    reviewerMap.set(review.author.login, {
      login: review.author.login,
      avatarUrl: review.author.avatarUrl ?? "",
      state: review.state ?? "COMMENTED"
    });
  }
  const ciContexts = node.commits?.nodes?.[0]?.commit?.statusCheckRollup?.contexts?.nodes ?? [];
  const ciChecks = ciContexts.map((ctx) => ({
    name: ctx.name ?? ctx.context ?? "unknown",
    status: (ctx.conclusion ?? ctx.state ?? "PENDING").toUpperCase(),
    conclusion: ctx.conclusion ?? null
  }));
  const ciState = computeCIState(ciContexts);
  const labels = (node.labels?.nodes ?? []).map((l) => ({
    name: l.name ?? "",
    color: l.color ?? ""
  }));
  return {
    id: node.id ?? "",
    number: node.number ?? 0,
    title: node.title ?? "",
    url: node.url ?? "",
    repo: node.repository?.nameWithOwner ?? extractRepo(node.url ?? ""),
    state: node.state ?? "OPEN",
    isDraft: node.isDraft ?? false,
    author: {
      login: node.author?.login ?? "",
      avatarUrl: node.author?.avatarUrl ?? ""
    },
    additions: node.additions ?? 0,
    deletions: node.deletions ?? 0,
    changedFiles: node.changedFiles ?? 0,
    reviewDecision: node.reviewDecision ?? null,
    reviewers: Array.from(reviewerMap.values()),
    ciState,
    ciChecks,
    mergeable: node.mergeable ?? "UNKNOWN",
    labels,
    createdAt: node.createdAt ?? "",
    updatedAt: node.updatedAt ?? "",
    isUnread: false
  };
}
function transformResponse(data) {
  if (!data?.search) return [];
  const edges = data.search.edges ?? [];
  const nodes = data.search.nodes ?? [];
  const prNodes = edges.length > 0 ? edges.map((e) => e.node) : nodes;
  return prNodes.filter(Boolean).map(normalizePR);
}

// src/api/rate-limiter.ts
var RateLimiter = class {
  constructor(maxConcurrent = 3, minSpacing = 200) {
    this.queue = [];
    this.active = 0;
    this.lastRequestTime = 0;
    this.maxConcurrent = maxConcurrent;
    this.minSpacing = minSpacing;
  }
  async enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }
  async processQueue() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) return;
    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    if (timeSinceLast < this.minSpacing) {
      setTimeout(() => this.processQueue(), this.minSpacing - timeSinceLast);
      return;
    }
    const item = this.queue.shift();
    this.active++;
    this.lastRequestTime = Date.now();
    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.active--;
      this.processQueue();
    }
  }
};

// src/utils/query-preprocessor.ts
function preprocessQuery(query, currentUser) {
  return query.replace(/\{currentUser\}/g, currentUser);
}

// src/hooks/useSectionData.ts
var rateLimiter = new RateLimiter(3, 200);
function useSectionData(config, currentUser) {
  const { token } = useAuthContext();
  const { unreadUrls } = useUnreadContext();
  const [prs, setPrs] = useState4([]);
  const [totalCount, setTotalCount] = useState4(0);
  const [isLoading, setIsLoading] = useState4(true);
  const [error, setError] = useState4(null);
  const abortControllerRef = useRef3();
  const fetchData = useCallback3(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsLoading(true);
    setError(null);
    try {
      const processedQuery = preprocessQuery(config.query, currentUser);
      const data = await rateLimiter.enqueue(async () => {
        if (abortController.signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
        return executeQuery(processedQuery, token);
      });
      if (abortController.signal.aborted) return;
      const normalized = transformResponse(data);
      const withUnread = normalized.map((pr) => ({
        ...pr,
        isUnread: unreadUrls.has(pr.url)
      }));
      setPrs(withUnread);
      setTotalCount(data?.search?.issueCount ?? withUnread.length);
      setIsLoading(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (abortController.signal.aborted) return;
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    }
  }, [token, config.query, currentUser, unreadUrls]);
  useEffect4(() => {
    fetchData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);
  const refresh = useCallback3(async () => {
    await fetchData();
  }, [fetchData]);
  return { prs, totalCount, isLoading, error, refresh };
}

// src/hooks/useSortedPRs.ts
import { useMemo } from "react";
var ciStateOrder = {
  FAILURE: 0,
  PENDING: 1,
  SUCCESS: 2,
  NONE: 3
};
var reviewStateOrder = {
  CHANGES_REQUESTED: 0,
  REVIEW_REQUIRED: 1,
  APPROVED: 2
};
function comparePRs(a, b, field) {
  switch (field) {
    case "updated":
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    case "created":
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case "lines":
      return a.additions + a.deletions - (b.additions + b.deletions);
    case "reviewState": {
      const aOrder = a.reviewDecision ? reviewStateOrder[a.reviewDecision] ?? 3 : 3;
      const bOrder = b.reviewDecision ? reviewStateOrder[b.reviewDecision] ?? 3 : 3;
      return aOrder - bOrder;
    }
    case "ciState":
      return ciStateOrder[a.ciState] - ciStateOrder[b.ciState];
    default:
      return 0;
  }
}
function useSortedPRs(prs, sort) {
  return useMemo(() => {
    const sorted = [...prs].sort((a, b) => comparePRs(a, b, sort.field));
    if (sort.direction === "desc") {
      sorted.reverse();
    }
    return sorted;
  }, [prs, sort.field, sort.direction]);
}

// src/components/Section/SectionHeader.tsx
import { jsx as jsx9, jsxs as jsxs3 } from "react/jsx-runtime";
var sortOptions = [
  { value: "updated", label: "Updated" },
  { value: "created", label: "Created" },
  { value: "lines", label: "Lines" },
  { value: "reviewState", label: "Review" },
  { value: "ciState", label: "CI" }
];
function SectionHeader({
  title,
  count,
  collapsed,
  onToggleCollapse,
  sort,
  onSortChange,
  onRefresh,
  isLoading
}) {
  return /* @__PURE__ */ jsxs3("div", { className: "lgtm-section__header", onClick: onToggleCollapse, children: [
    /* @__PURE__ */ jsx9(
      "span",
      {
        className: `lgtm-section__chevron${collapsed ? " lgtm-section__chevron--collapsed" : ""}`,
        children: "\u25BE"
      }
    ),
    /* @__PURE__ */ jsx9("span", { className: "lgtm-section__title", children: title }),
    /* @__PURE__ */ jsx9("span", { className: "lgtm-section__count", children: count }),
    /* @__PURE__ */ jsx9("span", { className: "lgtm-section__spacer" }),
    /* @__PURE__ */ jsxs3(
      "div",
      {
        className: "lgtm-section__actions",
        onClick: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ jsx9(
            "select",
            {
              className: "lgtm-section__sort-select",
              value: sort.field,
              onChange: (e) => onSortChange(e.target.value),
              title: "Sort by",
              children: sortOptions.map((opt) => /* @__PURE__ */ jsx9("option", { value: opt.value, children: opt.label }, opt.value))
            }
          ),
          /* @__PURE__ */ jsx9(
            "button",
            {
              className: `lgtm-section__refresh-btn${isLoading ? " lgtm-section__refresh-btn--loading" : ""}`,
              onClick: onRefresh,
              title: "Refresh",
              disabled: isLoading,
              children: "\u21BB"
            }
          )
        ]
      }
    )
  ] });
}

// src/components/Section/ColumnHeaders.tsx
import { jsx as jsx10, jsxs as jsxs4 } from "react/jsx-runtime";
var columns = [
  { label: "", field: null },
  // unread dot spacer
  { label: "", field: null },
  // avatar spacer
  { label: "Title", field: null },
  { label: "CI", field: "ciState" },
  { label: "Reviews", field: "reviewState" },
  { label: "Merge", field: null },
  { label: "Lines", field: "lines" },
  { label: "Updated", field: "updated" }
];
function ColumnHeaders({ sort, onSortChange }) {
  return /* @__PURE__ */ jsx10("div", { className: "lgtm-column-headers", children: columns.map((col, i) => {
    const isActive = col.field !== null && sort.field === col.field;
    const isSortable = col.field !== null;
    const cellClass = [
      "lgtm-column-headers__cell",
      isActive ? "lgtm-column-headers__cell--active" : "",
      !isSortable ? "lgtm-column-headers__cell--spacer" : ""
    ].filter(Boolean).join(" ");
    return /* @__PURE__ */ jsxs4(
      "div",
      {
        className: cellClass,
        onClick: isSortable ? () => onSortChange(col.field) : void 0,
        children: [
          col.label,
          isActive && /* @__PURE__ */ jsx10("span", { className: "lgtm-column-headers__sort-arrow", children: sort.direction === "asc" ? "\u25B2" : "\u25BC" })
        ]
      },
      i
    );
  }) });
}

// src/hooks/useRelativeTime.ts
import { useState as useState5, useEffect as useEffect5 } from "react";
var SECOND = 1e3;
var MINUTE = 60 * SECOND;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
function formatRelativeTime(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
function useRelativeTime(timestamp) {
  const [formatted, setFormatted] = useState5(
    () => formatRelativeTime(timestamp)
  );
  useEffect5(() => {
    setFormatted(formatRelativeTime(timestamp));
    const interval = setInterval(() => {
      setFormatted(formatRelativeTime(timestamp));
    }, 6e4);
    return () => clearInterval(interval);
  }, [timestamp]);
  return formatted;
}

// src/components/common/Avatar.tsx
import { jsx as jsx11 } from "react/jsx-runtime";
function Avatar({ login, avatarUrl, size = 24 }) {
  return /* @__PURE__ */ jsx11(
    "span",
    {
      className: "lgtm-avatar",
      style: { width: size, height: size },
      title: login,
      children: /* @__PURE__ */ jsx11(
        "img",
        {
          className: "lgtm-avatar__img",
          src: avatarUrl,
          alt: login,
          width: size,
          height: size,
          loading: "lazy"
        }
      )
    }
  );
}

// src/components/common/StatusIcon.tsx
import { jsx as jsx12 } from "react/jsx-runtime";
var iconMap = {
  success: "\u2713",
  failure: "\u2717",
  pending: "\u25CF",
  none: "\u2014"
};
function StatusIcon({ status, title }) {
  return /* @__PURE__ */ jsx12(
    "span",
    {
      className: `lgtm-status-icon lgtm-status-icon--${status}`,
      title,
      role: "img",
      "aria-label": title ?? status,
      children: iconMap[status]
    }
  );
}
function ciStatusToType(ciState) {
  switch (ciState) {
    case "SUCCESS":
      return "success";
    case "FAILURE":
      return "failure";
    case "PENDING":
      return "pending";
    default:
      return "none";
  }
}
function reviewStatusToType(decision) {
  switch (decision) {
    case "APPROVED":
      return "success";
    case "CHANGES_REQUESTED":
      return "failure";
    case "REVIEW_REQUIRED":
      return "pending";
    default:
      return "none";
  }
}
function mergeStatusToType(mergeable) {
  switch (mergeable) {
    case "MERGEABLE":
      return "success";
    case "CONFLICTING":
      return "failure";
    default:
      return "none";
  }
}

// src/components/PRRow.tsx
import { jsx as jsx13, jsxs as jsxs5 } from "react/jsx-runtime";
function PRRow({ pr }) {
  const relativeTime = useRelativeTime(pr.updatedAt);
  return /* @__PURE__ */ jsxs5("div", { className: "lgtm-pr-row", children: [
    /* @__PURE__ */ jsx13(
      "span",
      {
        className: `lgtm-pr-row__unread${pr.isUnread ? " lgtm-pr-row__unread--active" : ""}`
      }
    ),
    /* @__PURE__ */ jsx13("div", { className: "lgtm-pr-row__author", children: /* @__PURE__ */ jsx13(
      Avatar,
      {
        login: pr.author.login,
        avatarUrl: pr.author.avatarUrl,
        size: 24
      }
    ) }),
    /* @__PURE__ */ jsxs5("div", { className: "lgtm-pr-row__info", children: [
      /* @__PURE__ */ jsxs5(
        "a",
        {
          className: "lgtm-pr-row__title",
          href: pr.url,
          target: "_blank",
          rel: "noopener noreferrer",
          title: pr.title,
          children: [
            pr.title,
            pr.isDraft && /* @__PURE__ */ jsx13("span", { className: "lgtm-pr-row__draft-badge", children: "Draft" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs5("div", { className: "lgtm-pr-row__subtitle", children: [
        pr.repo,
        "#",
        pr.number
      ] })
    ] }),
    /* @__PURE__ */ jsx13("div", { className: "lgtm-pr-row__ci", children: /* @__PURE__ */ jsx13(
      StatusIcon,
      {
        status: ciStatusToType(pr.ciState),
        title: `CI: ${pr.ciState.toLowerCase()}`
      }
    ) }),
    /* @__PURE__ */ jsxs5("div", { className: "lgtm-pr-row__reviews", children: [
      /* @__PURE__ */ jsx13(
        StatusIcon,
        {
          status: reviewStatusToType(pr.reviewDecision),
          title: pr.reviewDecision ? `Review: ${pr.reviewDecision.toLowerCase().replace("_", " ")}` : "No reviews"
        }
      ),
      pr.reviewers.length > 0 && /* @__PURE__ */ jsx13("div", { className: "lgtm-reviewer-stack", children: pr.reviewers.slice(0, 3).map((reviewer) => /* @__PURE__ */ jsx13(
        "span",
        {
          className: "lgtm-reviewer-stack__item",
          children: /* @__PURE__ */ jsx13(
            Avatar,
            {
              login: reviewer.login,
              avatarUrl: reviewer.avatarUrl,
              size: 18
            }
          )
        },
        reviewer.login
      )) })
    ] }),
    /* @__PURE__ */ jsx13("div", { className: "lgtm-pr-row__merge", children: /* @__PURE__ */ jsx13(
      StatusIcon,
      {
        status: mergeStatusToType(pr.mergeable),
        title: `Merge: ${pr.mergeable.toLowerCase()}`
      }
    ) }),
    /* @__PURE__ */ jsxs5("div", { className: "lgtm-pr-row__lines", children: [
      /* @__PURE__ */ jsxs5("span", { className: "lgtm-pr-row__additions", children: [
        "+",
        pr.additions
      ] }),
      /* @__PURE__ */ jsxs5("span", { className: "lgtm-pr-row__deletions", children: [
        "-",
        pr.deletions
      ] })
    ] }),
    /* @__PURE__ */ jsx13("div", { className: "lgtm-pr-row__time", children: relativeTime })
  ] });
}

// src/components/common/EmptyState.tsx
import { jsx as jsx14 } from "react/jsx-runtime";
function EmptyState({
  message = "No pull requests"
}) {
  return /* @__PURE__ */ jsx14("div", { className: "lgtm-empty-state", children: message });
}

// src/components/Section/PRSection.tsx
import { Fragment as Fragment2, jsx as jsx15, jsxs as jsxs6 } from "react/jsx-runtime";
function PRSection({ config }) {
  const currentUser = useCurrentUser();
  const { dispatch } = useDashboardContext();
  const { prs, totalCount, isLoading, error, refresh } = useSectionData(
    config,
    currentUser
  );
  const sortedPRs = useSortedPRs(prs, config.sort);
  const handleToggleCollapse = useCallback4(() => {
    dispatch({
      type: "UPDATE_SECTION",
      payload: {
        id: config.id,
        updates: { collapsed: !config.collapsed }
      }
    });
  }, [dispatch, config.id, config.collapsed]);
  const handleSortChange = useCallback4(
    (field) => {
      const direction = config.sort.field === field && config.sort.direction === "desc" ? "asc" : "desc";
      dispatch({
        type: "UPDATE_SECTION",
        payload: {
          id: config.id,
          updates: { sort: { field, direction } }
        }
      });
    },
    [dispatch, config.id, config.sort]
  );
  return /* @__PURE__ */ jsxs6("div", { className: "lgtm-section", children: [
    /* @__PURE__ */ jsx15(
      SectionHeader,
      {
        title: config.title,
        count: totalCount,
        collapsed: config.collapsed,
        onToggleCollapse: handleToggleCollapse,
        sort: config.sort,
        onSortChange: handleSortChange,
        onRefresh: refresh,
        isLoading
      }
    ),
    !config.collapsed && /* @__PURE__ */ jsx15(Fragment2, { children: isLoading && prs.length === 0 ? /* @__PURE__ */ jsx15("div", { className: "lgtm-section__loading", children: /* @__PURE__ */ jsx15(Spinner, {}) }) : error ? /* @__PURE__ */ jsxs6("div", { className: "lgtm-section__error", children: [
      /* @__PURE__ */ jsx15("span", { children: error.message }),
      /* @__PURE__ */ jsx15("button", { className: "lgtm-section__error-btn", onClick: refresh, children: "Retry" })
    ] }) : sortedPRs.length === 0 ? /* @__PURE__ */ jsx15(EmptyState, {}) : /* @__PURE__ */ jsxs6(Fragment2, { children: [
      /* @__PURE__ */ jsx15(ColumnHeaders, { sort: config.sort, onSortChange: handleSortChange }),
      sortedPRs.map((pr) => /* @__PURE__ */ jsx15(PRRow, { pr }, pr.id))
    ] }) })
  ] });
}

// src/components/SettingsModal.tsx
import { jsx as jsx16, jsxs as jsxs7 } from "react/jsx-runtime";
function SettingsModal({ onClose }) {
  const { settings, dispatch } = useDashboardContext();
  const handleThemeChange = (theme) => {
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { theme }
    });
  };
  return /* @__PURE__ */ jsx16("div", { className: "lgtm-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs7("div", { className: "lgtm-modal", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs7("div", { className: "lgtm-modal__header", children: [
      /* @__PURE__ */ jsx16("h3", { className: "lgtm-modal__title", children: "Settings" }),
      /* @__PURE__ */ jsx16("button", { className: "lgtm-modal__close", onClick: onClose, children: "\xD7" })
    ] }),
    /* @__PURE__ */ jsxs7("div", { className: "lgtm-modal__section", children: [
      /* @__PURE__ */ jsx16("label", { className: "lgtm-modal__label", children: "Theme" }),
      /* @__PURE__ */ jsxs7("div", { className: "lgtm-modal__radio-group", children: [
        /* @__PURE__ */ jsxs7("label", { className: "lgtm-modal__radio-label", children: [
          /* @__PURE__ */ jsx16(
            "input",
            {
              type: "radio",
              name: "theme",
              value: "light",
              checked: settings.theme === "light",
              onChange: () => handleThemeChange("light")
            }
          ),
          "Light"
        ] }),
        /* @__PURE__ */ jsxs7("label", { className: "lgtm-modal__radio-label", children: [
          /* @__PURE__ */ jsx16(
            "input",
            {
              type: "radio",
              name: "theme",
              value: "dark",
              checked: settings.theme === "dark",
              onChange: () => handleThemeChange("dark")
            }
          ),
          "Dark"
        ] }),
        /* @__PURE__ */ jsxs7("label", { className: "lgtm-modal__radio-label", children: [
          /* @__PURE__ */ jsx16(
            "input",
            {
              type: "radio",
              name: "theme",
              value: "auto",
              checked: settings.theme === "auto",
              onChange: () => handleThemeChange("auto")
            }
          ),
          "System"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx16("div", { className: "lgtm-modal__actions", children: /* @__PURE__ */ jsx16("button", { className: "lgtm-btn", onClick: onClose, children: "Close" }) })
  ] }) });
}

// src/components/PRDashboard.tsx
import { Fragment as Fragment3, jsx as jsx17, jsxs as jsxs8 } from "react/jsx-runtime";
function PRDashboard() {
  const { sections } = useDashboardContext();
  const [showSettings, setShowSettings] = useState6(false);
  const sortedSections = useMemo2(
    () => [...sections].sort((a, b) => a.order - b.order),
    [sections]
  );
  return /* @__PURE__ */ jsxs8(Fragment3, { children: [
    /* @__PURE__ */ jsxs8("header", { className: "lgtm-header", children: [
      /* @__PURE__ */ jsx17("h1", { className: "lgtm-header__title", children: "LGTM" }),
      /* @__PURE__ */ jsx17("div", { className: "lgtm-header__actions", children: /* @__PURE__ */ jsx17(
        "button",
        {
          className: "lgtm-btn lgtm-btn--icon lgtm-btn--ghost",
          onClick: () => setShowSettings(true),
          title: "Settings",
          children: "\u2699"
        }
      ) })
    ] }),
    sortedSections.map((section) => /* @__PURE__ */ jsx17(PRSection, { config: section }, section.id)),
    showSettings && /* @__PURE__ */ jsx17(SettingsModal, { onClose: () => setShowSettings(false) })
  ] });
}

// src/components/ThemeWrapper.tsx
import { useEffect as useEffect6, useState as useState7 } from "react";
import { jsx as jsx18 } from "react/jsx-runtime";
function useResolvedTheme(theme) {
  const [systemDark, setSystemDark] = useState7(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect6(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setSystemDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  if (theme === "auto") {
    return systemDark ? "dark" : "light";
  }
  return theme;
}
function ThemeWrapper({ children }) {
  const { settings } = useDashboardContext();
  const resolvedTheme = useResolvedTheme(settings.theme);
  return /* @__PURE__ */ jsx18("div", { className: "lgtm-dashboard", "data-theme": resolvedTheme, children });
}

// src/components/LGTM.tsx
import { jsx as jsx19 } from "react/jsx-runtime";
function LGTM({ adapters, currentUser, onError }) {
  return /* @__PURE__ */ jsx19(AdapterProvider, { storage: adapters.storage, auth: adapters.auth, children: /* @__PURE__ */ jsx19(AuthProvider, { children: /* @__PURE__ */ jsx19(DashboardProvider, { children: /* @__PURE__ */ jsx19(UnreadProvider, { children: /* @__PURE__ */ jsx19(CurrentUserProvider, { currentUser, children: /* @__PURE__ */ jsx19(ErrorBoundary, { onError, children: /* @__PURE__ */ jsx19(ThemeWrapper, { children: /* @__PURE__ */ jsx19(AuthGate, { children: /* @__PURE__ */ jsx19(PRDashboard, {}) }) }) }) }) }) }) }) });
}
export {
  LGTM,
  defaultSections
};
//# sourceMappingURL=index.js.map