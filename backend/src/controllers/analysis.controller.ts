import { Request, Response } from "express"
import { HTTPSTATUS } from "../config/http.config"
import { catchAsync } from "../utils/catchAsync"
import { AppError } from "../utils/appError"
import { prisma } from "../database/prisma"

/**
 * Retrieves the status and progress of an analysis job.
 */
export const getAnalysisJobStatusHandler = catchAsync(async (req: Request, res: Response) => {
    const jobId = req.params.jobId as string

    const job = await prisma.analysisJob.findUnique({
        where: { id: jobId },
        include: {
            repository: {
                select: {
                    owner: true,
                    name: true,
                    status: true
                }
            }
        }
    })

    if (!job) {
        throw new AppError("Analysis job not found", HTTPSTATUS.NOT_FOUND, "JOB_NOT_FOUND")
    }

    // Calculate duration if applicable
    let durationMs = null
    if (job.startedAt) {
        const end = job.completedAt || new Date()
        durationMs = end.getTime() - job.startedAt.getTime()
    }

    res.status(HTTPSTATUS.OK).json({
        data: {
            id: job.id,
            repositoryId: job.repositoryId,
            repositoryName: (job as any).repository ? `${(job as any).repository.owner}/${(job as any).repository.name}` : "Unknown",
            status: job.status,
            currentStep: job.currentStep,
            progress: job.progress,
            error: job.error,
            durationMs,
            startedAt: job.startedAt,
            completedAt: job.completedAt
        }
    })
})
