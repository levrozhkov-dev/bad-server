import { Router } from 'express'
import {
    getCurrentUser,
    getCurrentUserRoles,
    getCsrfToken,
    login,
    logout,
    refreshAccessToken,
    register,
    updateCurrentUser,
} from '../controllers/auth'
import auth from '../middlewares/auth'
import csrfProtection from '../middlewares/csrf'
import {
    validateAuthentication,
    validateUserBody,
    validateUserUpdateBody,
} from '../middlewares/validations'

const authRouter = Router()

authRouter.get('/user', auth, getCurrentUser)
authRouter.patch('/me', auth, validateUserUpdateBody, updateCurrentUser)
authRouter.get('/user/roles', auth, getCurrentUserRoles)
authRouter.get('/csrf-token', getCsrfToken)
authRouter.post('/login', validateAuthentication, login)
authRouter.post('/token', csrfProtection, refreshAccessToken)
authRouter.post('/logout', csrfProtection, logout)
authRouter.post('/register', validateUserBody, register)

export default authRouter
