import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Error as MongooseError } from 'mongoose'
import { CSRF_TOKEN, REFRESH_TOKEN } from '../config'
import BadRequestError from '../errors/bad-request-error'
import ConflictError from '../errors/conflict-error'
import NotFoundError from '../errors/not-found-error'
import UnauthorizedError from '../errors/unauthorized-error'
import User from '../models/user'
import getSafeUserUpdate from '../utils/getSafeUserUpdate'

const createCsrfToken = () => crypto.randomBytes(32).toString('hex')

const setCsrfToken = (res: Response) => {
    const csrfToken = createCsrfToken()
    res.cookie(CSRF_TOKEN.cookie.name, csrfToken, CSRF_TOKEN.cookie.options)
    return csrfToken
}

const expireCookieOptions = {
    ...REFRESH_TOKEN.cookie.options,
    maxAge: -1,
}

const expireCsrfCookieOptions = {
    ...CSRF_TOKEN.cookie.options,
    maxAge: -1,
}

// POST /auth/login
const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body
        const user = await User.findUserByCredentials(email, password)
        const accessToken = user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        const csrfToken = setCsrfToken(res)
        res.cookie(
            REFRESH_TOKEN.cookie.name,
            refreshToken,
            REFRESH_TOKEN.cookie.options
        )
        return res.json({
            success: true,
            user,
            accessToken,
            csrfToken,
        })
    } catch (err) {
        return next(err)
    }
}

const getCsrfToken = (_req: Request, res: Response) => {
    const csrfToken = setCsrfToken(res)
    return res.json({ csrfToken })
}

// POST /auth/register
const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name } = req.body
        const newUser = new User({ email, password, name })
        await newUser.save()
        const accessToken = newUser.generateAccessToken()
        const refreshToken = await newUser.generateRefreshToken()
        const csrfToken = setCsrfToken(res)

        res.cookie(
            REFRESH_TOKEN.cookie.name,
            refreshToken,
            REFRESH_TOKEN.cookie.options
        )
        return res.status(constants.HTTP_STATUS_CREATED).json({
            success: true,
            user: newUser,
            accessToken,
            csrfToken,
        })
    } catch (error) {
        if (error instanceof MongooseError.ValidationError) {
            return next(new BadRequestError(error.message))
        }
        if (error instanceof Error && error.message.includes('E11000')) {
            return next(
                new ConflictError('Пользователь с таким email уже существует')
            )
        }
        return next(error)
    }
}

// GET /auth/user
const getCurrentUser = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = res.locals.user._id
        const user = await User.findById(userId).orFail(
            () =>
                new NotFoundError(
                    'Пользователь по заданному id отсутствует в базе'
                )
        )
        res.json({ user, success: true })
    } catch (error) {
        next(error)
    }
}

// Можно лучше: вынести общую логику получения данных из refresh токена
const deleteRefreshTokenInUser = async (
    req: Request,
    _res: Response,
    _next: NextFunction
) => {
    const { cookies } = req
    const rfTkn = cookies[REFRESH_TOKEN.cookie.name]

    if (!rfTkn) {
        throw new UnauthorizedError('Не валидный токен')
    }

    const decodedRefreshTkn = jwt.verify(
        rfTkn,
        REFRESH_TOKEN.secret
    ) as JwtPayload
    const user = await User.findOne({
        _id: decodedRefreshTkn._id,
    }).orFail(() => new UnauthorizedError('Пользователь не найден в базе'))

    const rTknHash = crypto
        .createHmac('sha256', REFRESH_TOKEN.secret)
        .update(rfTkn)
        .digest('hex')

    user.tokens = user.tokens.filter((tokenObj) => tokenObj.token !== rTknHash)

    await user.save()

    return user
}

// Реализация удаления токена из базы может отличаться
// POST /auth/logout
const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await deleteRefreshTokenInUser(req, res, next)
        res.cookie(REFRESH_TOKEN.cookie.name, '', expireCookieOptions)
        res.cookie(CSRF_TOKEN.cookie.name, '', expireCsrfCookieOptions)
        res.status(200).json({
            success: true,
        })
    } catch (error) {
        next(error)
    }
}

// POST /auth/token
const refreshAccessToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userWithRefreshTkn = await deleteRefreshTokenInUser(
            req,
            res,
            next
        )
        const accessToken = await userWithRefreshTkn.generateAccessToken()
        const refreshToken = await userWithRefreshTkn.generateRefreshToken()
        const csrfToken = setCsrfToken(res)
        res.cookie(
            REFRESH_TOKEN.cookie.name,
            refreshToken,
            REFRESH_TOKEN.cookie.options
        )
        return res.json({
            success: true,
            user: userWithRefreshTkn,
            accessToken,
            csrfToken,
        })
    } catch (error) {
        return next(error)
    }
}

const getCurrentUserRoles = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        res.status(200).json(res.locals.user.roles)
    } catch (error) {
        next(error)
    }
}

const updateCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const userId = res.locals.user._id
    try {
        const userUpdate = getSafeUserUpdate(req.body)

        if (!Object.keys(userUpdate).length) {
            return next(new BadRequestError('Нет данных для обновления'))
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: userUpdate },
            {
                new: true,
                runValidators: true,
            }
        ).orFail(
            () =>
                new NotFoundError(
                    'Пользователь по заданному id отсутствует в базе'
                )
        )
        res.status(200).json(updatedUser)
    } catch (error) {
        next(error)
    }
}

export {
    getCurrentUser,
    getCurrentUserRoles,
    getCsrfToken,
    login,
    logout,
    refreshAccessToken,
    register,
    updateCurrentUser,
}
