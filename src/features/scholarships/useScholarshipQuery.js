import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

import { scholarships as scholarshipsApi } from "../../lib/api/endpoints.js";
import { useApi, useDebouncedValue } from "../../lib/hooks.js";
import { filterScholarships, paginate, todayISO } from "./localFilter.js";

const EMPTY_FACETS = { countries: [], degree_levels: [] };

// The instant-filter index loads the slim catalogue in pages of 100. Above the
// cap we stay in server mode: a table that large should not live in the tab.
const INDEX_PAGE_SIZE = 100;
const INDEX_ROW_CAP = 1000;

const DEFAULTS = {
  q: "",
  country: "",
  degree: "",
  ordering: "newest",
  page: 1,
};

function readParams(searchParams) {
  return {
    q: searchParams.get("q") ?? DEFAULTS.q,
    country: searchParams.get("country") ?? DEFAULTS.country,
    degree: searchParams.get("degree") ?? DEFAULTS.degree,
    ordering: searchParams.get("ordering") ?? DEFAULTS.ordering,
    page: Math.max(1, Number(searchParams.get("page")) || 1),
  };
}

/**
 * Load the entire slim catalogue for instant client-side filtering.
 *
 * Admins fetch ``view=all`` - one shared index serves both the live board and
 * the archive, so switching between them costs nothing. Each page request
 * flows through the shared client cache (2 min fresh, stale-while-revalidate
 * after), so repeat visits assemble the index without touching the network,
 * and any admin write invalidates it by tag.
 */
async function fetchIndex(admin, { signal }) {
  const rows = [];
  let page = 1;
  for (;;) {
    const params = {
      page_size: INDEX_PAGE_SIZE,
      page: page > 1 ? page : undefined,
      view: admin ? "all" : undefined,
    };
    const data = admin
      ? await scholarshipsApi.adminList(params, { signal })
      : await scholarshipsApi.list(params, { signal });
    rows.push(...(data.results ?? []));
    if (!data.has_next) return { rows, complete: true };
    if (rows.length >= INDEX_ROW_CAP) return { rows: [], complete: false };
    page += 1;
  }
}

/**
 * Drives the scholarship board.
 *
 * Two speeds, one behaviour:
 *
 *  1. On first paint the current page is fetched from the server (filtered,
 *     paginated, cached) - nothing waits on the full catalogue.
 *  2. In the background the slim catalogue loads into a local index. From then
 *     on, searching, filtering, sorting and paging are computed in memory and
 *     respond on every keystroke with no network round trip at all.
 *
 * Filter state lives in the URL, so any view is shareable and survives a
 * refresh. If the catalogue outgrows the index cap, the hook transparently
 * falls back to debounced server-side filtering.
 *
 * @param {{ admin?: boolean, view?: "live" | "archived" }} options
 *   `view: "archived"` (admin only) drives the archive page: scholarships
 *   that are hidden or whose deadline has passed.
 */
export function useScholarshipQuery({ admin = false, view = "live" } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const values = useMemo(() => readParams(searchParams), [searchParams]);

  const index = useApi(({ signal }) => fetchIndex(admin, { signal }), [admin], {
    keepPreviousData: true,
  });
  const indexRows = index.data?.complete ? index.data.rows : null;
  const localMode = indexRows !== null;

  // Server mode only: debounce typing so we do not fire a request per key.
  const debouncedQuery = useDebouncedValue(values.q, 250);

  const requestParams = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      country: values.country || undefined,
      degree: values.degree || undefined,
      view: view !== "live" ? view : undefined,
      ordering: values.ordering !== "newest" ? values.ordering : undefined,
      page: values.page > 1 ? values.page : undefined,
    }),
    [debouncedQuery, values.country, values.degree, view, values.ordering, values.page],
  );

  const listKey = JSON.stringify(requestParams);

  const list = useApi(
    ({ signal }) =>
      admin
        ? scholarshipsApi.adminList(requestParams, { signal })
        : scholarshipsApi.list(requestParams, { signal }),
    [listKey, admin],
    { keepPreviousData: true, enabled: !localMode },
  );

  // Instant path: pure computation over the in-memory index. Runs on the raw
  // (undebounced) values, so results change as fast as the user can type.
  const local = useMemo(() => {
    if (!localMode) return null;
    return paginate(
      filterScholarships(indexRows, values, todayISO(), view),
      values.page,
    );
  }, [localMode, indexRows, values, view]);

  const facets = useApi(({ signal }) => scholarshipsApi.facets({ signal }), [], {
    initialData: EMPTY_FACETS,
    keepPreviousData: true,
  });

  const setValue = useCallback(
    (key, value) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value === "" || value === false || value === null || value === undefined) {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
          // Any filter change invalidates the current page number.
          if (key !== "page") next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (page) => {
      setValue("page", page > 1 ? page : "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setValue],
  );

  const reset = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);

  const { refetch: refetchIndex } = index;
  const { refetch: refetchList } = list;
  const refetch = useCallback(() => {
    refetchIndex();
    if (!localMode) refetchList();
  }, [refetchIndex, refetchList, localMode]);

  return {
    values,
    setValue,
    setPage,
    reset,
    facets: facets.data ?? EMPTY_FACETS,
    results: local ? local.results : (list.data?.results ?? []),
    count: local ? local.count : (list.data?.count ?? null),
    page: local ? local.page : (list.data?.page ?? values.page),
    totalPages: local ? local.total_pages : (list.data?.total_pages ?? 0),
    isLoading: local ? false : list.isLoading,
    isRefreshing: local ? index.isRefreshing : list.isRefreshing,
    error: local ? null : list.error,
    refetch,
  };
}

export default useScholarshipQuery;
