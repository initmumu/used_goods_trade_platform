import express from "express"
import dotenv from "dotenv"

dotenv.config()

const app = express()

app.listen(5600, () => {
    console.log(`Server is on ${process.env.SERVER_PORT}`)
})
