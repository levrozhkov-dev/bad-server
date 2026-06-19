import { Router } from 'express'
import {
    getCurrentUser,
    getCurrentUserRoles,
    login,
    logout,
    refreshAccessToken,
    register,
    updateCurrentUser,
    getCsrfToken
} from '../controllers/auth'
import auth from '../middlewares/auth'
import csrfProtection from '../middlewares/csrf'

const authRouter = Router()

authRouter.get('/user', auth, getCurrentUser)
authRouter.patch('/me', auth, updateCurrentUser)
authRouter.get('/user/roles', auth, getCurrentUserRoles)
authRouter.post('/login', login)
authRouter.post('/token', csrfProtection, refreshAccessToken)
authRouter.post('/logout', csrfProtection, logout)
authRouter.post('/register', register)
authRouter.get('/csrf-token', getCsrfToken)

export default authRouter
