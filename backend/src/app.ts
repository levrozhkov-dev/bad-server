import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS, ORIGIN_ALLOW } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Слишком много запросов, попробуйте позже' },
})

const corsOptions: cors.CorsOptions = {
    origin(origin, callback) {
        if (!origin) {
            return callback(null, ORIGIN_ALLOW[0])
        }

        if (ORIGIN_ALLOW.includes(origin)) {
            return callback(null, origin)
        }

        return callback(null, false)
    },
    credentials: true,
}

app.use(cookieParser())

app.use(cors(corsOptions))
// app.use(express.static(path.join(__dirname, 'public')));

app.use(serveStatic(path.join(__dirname, 'public')))

app.use(apiLimiter)
app.use(urlencoded({ extended: true, limit: '100kb' }))
app.use(json({ limit: '100kb' }))

app.options('*', cors(corsOptions))
app.use(routes)
app.use(errorHandler)

// eslint-disable-next-line no-console

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
