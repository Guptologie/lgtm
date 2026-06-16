import { useEffect, useState } from 'react';
import type { FilterQuery } from '../../query/model';
import { compile } from '../../query/compile';
import { useServices } from '../../app/context';

export interface PreviewState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  count?: number;
}

const PREVIEW_QUERY = `query Preview($q: String!) { c: search(query: $q, type: ISSUE, first: 0) { issueCount } }`;

/** Debounced issueCount for a draft query, for the editor's live preview. */
export function usePreviewCount(query: FilterQuery): PreviewState {
  const { github } = useServices();
  const q = compile(query);
  const [state, setState] = useState<PreviewState>({ status: 'idle' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    const timer = setTimeout(() => {
      github
        .graphql<{ c: { issueCount: number } }>(PREVIEW_QUERY, { q })
        .then((data) => {
          if (!cancelled) setState({ status: 'ready', count: data.c.issueCount });
        })
        .catch(() => {
          if (!cancelled) setState({ status: 'error' });
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, github]);

  return state;
}
