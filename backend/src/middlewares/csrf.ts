import { RequestHandler } from 'express'
import { CSRF_TOKEN } from '../config'
import ForbiddenError from '../errors/forbidden-error'

const csrfProtection: RequestHandler = (req, _res, next) => {
    const csrfHeader = req.header(CSRF_TOKEN.header)
    const csrfCookie = req.cookies[CSRF_TOKEN.cookie.name]

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return next(new ForbiddenError('Некорректный токен'))
    }

    return next()
}

export default csrfProtection
