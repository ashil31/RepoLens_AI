import { Request, Response } from "express"
import { HTTPSTATUS } from "../config/http.config"

export const healthCheck = (req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
        status: "ok",
        service: "repo-lens-ai"
    })
}
