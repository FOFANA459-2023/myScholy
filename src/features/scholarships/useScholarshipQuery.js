import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { scholarships as scholarshipsApi } from "../../lib/api/endpoints.js";
import { useApi, useDebouncedValue } from "../../lib/hooks.js";

const EMPTY_FACETS = { countries: [], degree_levels: [] };

const DEFAULTS = {
  q: "",
  country: "",
  degree: "",
  ongoing: false,
  ordering: "newest",
  page: 1,
};

function readParams(searchParams) {
  return {
    q: searchParams.get("q") ?? DEFAULTS.q,
    country: searchParams.get("country") ?? DEFAULTS.country,
    degree: searchParams.get("degree") ?? DEFAULTS.degree,
    ongoing: searchParams.get("ongoing") === "true",
    ordering: searchParams.get("ordering") ?? DEFAULTS.ordering,
    page: Math.max(1, Number(searchParams.get("page")) || 1),
  };
}

/**
 * Drives the scholarship board.
 *
 * Filtering and pagination happen on the server, so the browser downloads one
 * page instead of the entire table. The search term is debounced and the filter
 * state lives in the URL, which makes any view shareable and survivable across
 * a refresh.
 *
 * @param {{ admin?: boolean }} options
 */
export function useScholarshipQuery({ admin = false } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const values = useMemo(() => readParams(searchParams), [searchParams]);

  // Only the search term needs debouncing; dropdowns fire once per change.
  const debouncedQuery = useDebouncedValue(values.q, 300);

  const requestParams = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      country: values.country || undefined,
      degree: values.degree || undefined,
      ongoing: values.ongoing || undefined,
      ordering: values.ordering !== "newest" ? values.ordering : undefined,
      page: values.page > 1 ? values.page : undefined,
    }),
    [debouncedQuery, values.country, values.degree, values.ongoing, values.ordering, values.page],
  );

  const listKey = JSON.stringify(requestParams);

  const list = useApi(
    ({ signal }) =>
      admin
        ? scholarshipsApi.adminList(requestParams, { signal })
        : scholarshipsApi.list(requestParams, { signal }),
    [listKey, admin],
    { keepPreviousData: true },
  );

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

  return {
    values,
    setValue,
    setPage,
    reset,
    facets: facets.data ?? EMPTY_FACETS,
    results: list.data?.results ?? [],
    count: list.data?.count ?? null,
    page: list.data?.page ?? values.page,
    totalPages: list.data?.total_pages ?? 0,
    isLoading: list.isLoading,
    isRefreshing: list.isRefreshing,
    error: list.error,
    refetch: list.refetch,
  };
}

export default useScholarshipQuery;
