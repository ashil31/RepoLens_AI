import app from "./app"
import { config } from "./config/app.config"

const PORT = config.PORT

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${config.NODE_ENV}`)
})
