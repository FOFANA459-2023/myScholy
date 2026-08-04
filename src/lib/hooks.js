import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "./api/client.js";

/**
 * Fetch data for a screen.
 *
 * Aborts on unmount and whenever the dependency key changes, so a fast typist
 * cannot have five overlapping searches racing to set state - and a stale
 * response can never overwrite a newer one.
 *
 * @param {(options: {signal: AbortSignal}) => Promise<any>} fetcher
 * @param {any[]} deps
 * @param {{
 *   enabled?: boolean,
 *   initialData?: any,
 *   keepPreviousData?: boolean,
 *   refetchInterval?: number,  // ms; poll while the tab is visible
 *   refetchOnFocus?: boolean,  // refresh when the user returns to the tab
 * }} config
 */
export function useApi(fetcher, deps = [], config = {}) {
  const {
    enabled = true,
    initialData = null,
    keepPreviousData = false,
    refetchInterval = 0,
    refetchOnFocus = false,
  } = config;

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const requestId = useRef(0);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const id = ++requestId.current;
    const hadData = data !== null && data !== undefined;

    if (hadData && keepPreviousData) setIsRefreshing(true);
    else setIsLoading(true);

    fetcherRef
      .current({ signal: controller.signal })
      .then((result) => {
        if (id !== requestId.current) return; // superseded
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted || err?.name === "AbortError") return;
        if (id !== requestId.current) return;
        setError(
          err instanceof ApiError ? err : new ApiError(err?.message || "Request failed"),
        );
        if (!keepPreviousData) setData(initialData);
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  // Live updates: poll on an interval and/or refresh when the tab regains
  // focus. Polling pauses while the tab is hidden - a wall of background tabs
  // should not keep hammering the API.
  useEffect(() => {
    if (!enabled || (!refetchInterval && !refetchOnFocus)) return undefined;

    let timer;
    const startPolling = () => {
      if (!refetchInterval || timer) return;
      timer = setInterval(() => {
        if (!document.hidden) refetch();
      }, refetchInterval);
    };
    const stopPolling = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        if (refetchOnFocus) refetch();
        startPolling();
      }
    };
    const onFocus = () => {
      if (refetchOnFocus) refetch();
    };

    startPolling();
    document.addEventListener("visibilitychange", onVisibility);
    if (refetchOnFocus) window.addEventListener("focus", onFocus);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
      if (refetchOnFocus) window.removeEventListener("focus", onFocus);
    };
  }, [enabled, refetchInterval, refetchOnFocus, refetch]);

  return { data, error, isLoading, isRefreshing, refetch, setData };
}

/** Debounce a rapidly changing value (search boxes). */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/** Run an async mutation with pending/error state and no double submits. */
export function useMutation(mutator) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    // Reset on every mount: StrictMode mounts, unmounts, and remounts in dev,
    // and the ref must not stay false after the throwaway first unmount.
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const mutate = useCallback(
    async (...args) => {
      setIsPending(true);
      setError(null);
      try {
        const result = await mutator(...args);
        return { ok: true, data: result };
      } catch (err) {
        const apiError =
          err instanceof ApiError ? err : new ApiError(err?.message || "Request failed");
        if (mounted.current) setError(apiError);
        return { ok: false, error: apiError };
      } finally {
        if (mounted.current) setIsPending(false);
      }
    },
    [mutator],
  );

  return { mutate, isPending, error, reset: () => setError(null) };
}

/** Media query hook used to avoid rendering both desktop and mobile trees. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener("change", handler);
    return () => list.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
