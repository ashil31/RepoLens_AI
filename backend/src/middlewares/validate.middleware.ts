import { Request, Response, NextFunction } from "express"
import { ZodTypeAny } from "zod"

export const validate =
    (schema: ZodTypeAny) =>
        (req: Request, res: Response, next: NextFunction) => {
            try {
                const validated = schema.parse({
                    body: req.body,
                    query: req.query,
                    params: req.params
                }) as { body: unknown; query?: unknown; params?: unknown }

                req.body = validated.body
                // req.query and req.params are read-only in Express; do not assign to them.
                next()
            } catch (err) {
                next(err)
            }
        }
