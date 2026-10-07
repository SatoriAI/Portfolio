import type { UseQueryResult } from "@tanstack/react-query";

import StatusMessage from "@/components/feedback/StatusMessage";

type QueryLike = Pick<UseQueryResult, "isPending" | "isError" | "isFetching" | "refetch">;

/**
 * The block for queries still on their way (a retry in flight included) or
 * failed, whose one retry refetches the failed ones; null once every one has
 * arrived, so a page writes `queryStatus(…) ?? <the content>`.
 */
export const queryStatus = (
  queries: readonly QueryLike[],
  labels: { loading: string; error: string; retry: string },
) => {
  if (queries.some((query) => query.isPending || (query.isError && query.isFetching))) {
    return <StatusMessage variant="loading" message={labels.loading} />;
  }
  const failed = queries.filter((query) => query.isError);
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
