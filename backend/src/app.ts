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

// ✅ SIMPLE + RELIABLE CORS (FINAL FIX)
app.use(
    cors({
        origin: [
            "https://repolens.live",
            "https://www.repolens.live",
            "http://localhost:3000",
            "http://localhost:3001"
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
)

// ✅ Helmet AFTER CORS
app.use(helmet())

// GitHub webhook (raw body)
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

app.use(V1_BASE_PATH, v1Routes)

app.use(errorHandler)

export default app
