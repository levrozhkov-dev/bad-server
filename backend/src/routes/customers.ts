import { Router } from 'express'
import {
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
} from '../controllers/customers'
import {
    validateCustomerId,
    validateUserUpdateBody,
} from '../middlewares/validations'
import auth, { roleGuardMiddleware } from '../middlewares/auth'
import { Role } from '../models/user'

const customerRouter = Router()

customerRouter.get('/', auth, roleGuardMiddleware(Role.Admin), getCustomers)
customerRouter.get(
    '/:id',
    auth,
    roleGuardMiddleware(Role.Admin),
    validateCustomerId,
    getCustomerById
)
customerRouter.patch(
    '/:id',
    auth,
    roleGuardMiddleware(Role.Admin),
    validateCustomerId,
    validateUserUpdateBody,
    updateCustomer
)
customerRouter.delete(
    '/:id',
    auth,
    roleGuardMiddleware(Role.Admin),
    validateCustomerId,
    deleteCustomer
)

export default customerRouter
