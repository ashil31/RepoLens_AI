import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"

import { config } from "./config/app.config"
import v1Routes from "./routes/v1/routes"
import { errorHandler } from "./middlewares/errorHandler.middleware"
import { handleWebhook } from "./controllers/repository.controller"

const app = express()

app.set("trust proxy", true)

app.use(helmet())

// GitHub webhook must receive raw body for signature verification; mount before json parser
const BASE_PATH = config.BASE_PATH
const V1_BASE_PATH = `${BASE_PATH}/v1`
app.post(
    `${V1_BASE_PATH}/github/webhook`,
    express.raw({ type: "application/json" }),
    handleWebhook
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())

app.use(
    cors({
        origin: config.FRONTEND_ORIGIN,
        credentials: true
    })
)

app.use(V1_BASE_PATH, v1Routes)

app.use(errorHandler)

export default app
