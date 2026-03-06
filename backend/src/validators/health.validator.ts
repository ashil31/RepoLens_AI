import { z } from "zod"

// Placeholder schema — extend as needed when health route requires query/params
export const healthQuerySchema = z.object({
    body: z.object({}).optional(),
    query: z.object({}).optional(),
    params: z.object({}).optional()
})
