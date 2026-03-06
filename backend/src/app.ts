import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"

import { config } from "./config/app.config"
import v1Routes from "./routes/v1/routes"
import { errorHandler } from "./middlewares/errorHandler.middleware"

const app = express()

app.set("trust proxy", true)

app.use(helmet())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cookieParser())

app.use(
    cors({
        origin: config.FRONTEND_ORIGIN,
        credentials: true
    })
)

const BASE_PATH = config.BASE_PATH
const V1_BASE_PATH = `${BASE_PATH}/v1`

app.use(V1_BASE_PATH, v1Routes)

app.use(errorHandler)

export default app
