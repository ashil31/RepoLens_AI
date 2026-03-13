import { api } from "@/lib/api/client";

export type JobStep =
  | "FETCHING_REPO"
  | "DOWNLOADING_FILES"
  | "PARSING_CODE"
  | "BUILDING_GRAPH"
  | "EMBEDDING"
  | "GENERATING_AI"
  | "DONE";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface AnalysisJobStatus {
  id: string;
  repositoryId: string;
  repositoryName: string;
  status: JobStatus;
  currentStep: JobStep | null;
  progress: number;
  error: string | null;
  durationMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface AnalysisJobStatusResponse {
  data: AnalysisJobStatus;
}

export async function getAnalysisJobStatus(jobId: string): Promise<AnalysisJobStatusResponse> {
  return api.get<AnalysisJobStatusResponse>(`/analysis/jobs/${jobId}`);
}
