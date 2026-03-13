"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import * as analysisService from "@/services/analysis.service";

/** Polls analysis job status. Stops when status is COMPLETED or FAILED. */
export function useAnalysisJob(jobId: string | null) {
  return useQuery({
    queryKey: queryKeys.analysisJob(jobId ?? ""),
    queryFn: () => analysisService.getAnalysisJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === "COMPLETED" || status === "FAILED") return false;
      return 2000; // Poll every 2s while PENDING or PROCESSING
    },
    staleTime: 1000,
  });
}
