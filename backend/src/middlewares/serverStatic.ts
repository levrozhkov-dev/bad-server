import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

const STATIC_CACHE_TTL_SECONDS = 60 * 60 * 24

export default function serveStatic(baseDir: string) {
    const rootDir = path.resolve(baseDir)

    return (req: Request, res: Response, next: NextFunction) => {
        let requestPath: string

        try {
            requestPath = decodeURIComponent(req.path)
        } catch {
            return next()
        }

        // Определяем полный путь к запрашиваемому файлу
        const filePath = path.resolve(rootDir, `.${requestPath}`)
        const relativePath = path.relative(rootDir, filePath)

        // Проверяем, что файл находится внутри разрешенной директории
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            return next()
        }

        // Проверяем, существует ли файл
        fs.stat(filePath, (err, fileStats) => {
            if (err || !fileStats.isFile()) {
                // Файл не существует отдаем дальше мидлварам
                return next()
            }
            // Файл существует, отправляем его клиенту
            res.setHeader(
                'Cache-Control',
                `public, max-age=${STATIC_CACHE_TTL_SECONDS}`
            )
            return res.sendFile(filePath, (sendFileError) => {
                if (sendFileError) {
                    next(sendFileError)
                }
            })
        })
    }
}
