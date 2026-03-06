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
                }) as { body: unknown; query: unknown; params: unknown }

                req.body = validated.body
                req.query = validated.query as Record<string, string>
                req.params = validated.params as Record<string, string>

                next()
            } catch (err) {
                next(err)
            }
        }
