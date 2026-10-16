import type { UseQueryResult } from "@tanstack/react-query";

import StatusMessage from "@/components/feedback/StatusMessage";

type QueryLike = Pick<UseQueryResult, "isPending" | "isLoadingError" | "isFetching" | "refetch">;

/**
 * The block for queries still on their way (a retry in flight included) or
 * failed, whose one retry refetches the failed ones; null once every one has
 * arrived, so a page writes `queryStatus(…) ?? <the content>`. A query that
 * has data counts as arrived even when fetching it again failed, so the
 * page keeps what it shows (the build's lists, when the API is down).
 */
export const queryStatus = (
  queries: readonly QueryLike[],
  labels: { loading: string; error: string; retry: string },
) => {
  if (queries.some((query) => query.isPending || (query.isLoadingError && query.isFetching))) {
    return <StatusMessage variant="loading" message={labels.loading} />;
  }
  const failed = queries.filter((query) => query.isLoadingError);
  if (failed.length > 0) {
    return (
      <StatusMessage
        variant="error"
        message={labels.error}
        onRetry={() => failed.forEach((query) => query.refetch())}
        retryLabel={labels.retry}
      />
    );
  }
  return null;
};
