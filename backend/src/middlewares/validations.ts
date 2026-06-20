import { RequestHandler } from 'express'
import Joi, { ObjectSchema } from 'joi'
import { Types } from 'mongoose'
import validator from 'validator'
import BadRequestError from '../errors/bad-request-error'

type RequestSchemas = {
    body?: ObjectSchema
    params?: ObjectSchema
    query?: ObjectSchema
}

function validateRequest(schemas: RequestSchemas): RequestHandler {
    return (req, _res, next) => {
        const locations: (keyof RequestSchemas)[] = ['body', 'params', 'query']

        const hasValidationError = locations.some((location) => {
            const schema = schemas[location]

            if (!schema) {
                return false
            }

            const { error, value } = schema.validate(req[location], {
                abortEarly: false,
            })

            if (error) {
                const message = error.details
                    .map((detail) => detail.message)
                    .join(', ')
                next(new BadRequestError(message))
                return true
            }

            if (location === 'body') {
                req.body = value
            } else if (location === 'params') {
                req.params = value
            } else {
                req.query = value
            }

            return false
        })

        if (hasValidationError) {
            return undefined
        }

        return next()
    }
}

export const phoneRegExp = /^\+?[0-9\s()-]{7,32}$/

export enum PaymentType {
    Card = 'card',
    Online = 'online',
}

const orderStatuses = ['cancelled', 'completed', 'new', 'delivering'] as const
const imageFileNameRegExp =
    /^\/?(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(?:png|jpe?g|gif|webp)$/

const productImageSchema = Joi.object()
    .keys({
        fileName: Joi.string().pattern(imageFileNameRegExp).required(),
        originalName: Joi.string().max(255).required(),
    })
    .unknown(false)

// валидация id
export const validateOrderBody = validateRequest({
    body: Joi.object()
        .keys({
            items: Joi.array()
                .items(
                    Joi.string().custom((value, helpers) => {
                        if (Types.ObjectId.isValid(value)) {
                            return value
                        }
                        return helpers.message({ custom: 'Невалидный id' })
                    })
                )
                .min(1)
                .max(100)
                .required()
                .messages({
                    'array.empty': 'Не указаны товары',
                    'array.min': 'Не указаны товары',
                }),
            payment: Joi.string()
                .valid(...Object.values(PaymentType))
                .required()
                .messages({
                    'string.valid':
                        'Указано не валидное значение для способа оплаты, возможные значения - "card", "online"',
                    'string.empty': 'Не указан способ оплаты',
                }),
            email: Joi.string().email().max(254).required().messages({
                'string.empty': 'Не указан email',
            }),
            phone: Joi.string().max(32).required().pattern(phoneRegExp).messages({
                'string.empty': 'Не указан телефон',
            }),
            address: Joi.string().max(200).required().messages({
                'string.empty': 'Не указан адрес',
            }),
            total: Joi.number().positive().required().messages({
                'string.empty': 'Не указана сумма заказа',
            }),
            comment: Joi.string()
                .max(1000)
                .custom((value) => validator.escape(value))
                .optional()
                .allow(''),
        })
        .unknown(false),
})

export const validateOrderListQuery = validateRequest({
    query: Joi.object()
        .keys({
            page: Joi.number().integer().positive(),
            limit: Joi.number().integer().positive(),
            sortField: Joi.string().valid(
                'createdAt',
                'totalAmount',
                'orderNumber',
                'status'
            ),
            sortOrder: Joi.string().valid('asc', 'desc'),
            status: Joi.string().valid(...orderStatuses),
            totalAmountFrom: Joi.number(),
            totalAmountTo: Joi.number(),
            orderDateFrom: Joi.date().iso(),
            orderDateTo: Joi.date().iso(),
            search: Joi.string().max(100),
        })
        .unknown(false),
})

export const validateOrderUpdateBody = validateRequest({
    body: Joi.object()
        .keys({
            status: Joi.string()
                .valid(...orderStatuses)
                .required(),
        })
        .unknown(false),
})

export const validateOrderNumberParam = validateRequest({
    params: Joi.object().keys({
        orderNumber: Joi.number().integer().positive().required(),
    }),
})

export const validateOrderIdParam = validateRequest({
    params: Joi.object().keys({
        id: Joi.string()
            .required()
            .custom((value, helpers) => {
                if (Types.ObjectId.isValid(value)) {
                    return value
                }
                return helpers.message({ any: 'Невалидный id' })
            }),
    }),
})

// валидация товара.
// name и link - обязательные поля, name - от 2 до 30 символов, link - валидный url
export const validateProductBody = validateRequest({
    body: Joi.object()
        .keys({
            title: Joi.string().required().min(2).max(30).messages({
                'string.min': 'Минимальная длина поля "name" - 2',
                'string.max': 'Максимальная длина поля "name" - 30',
                'string.empty': 'Поле "title" должно быть заполнено',
            }),
            image: productImageSchema,
            category: Joi.string().required().messages({
                'string.empty': 'Поле "category" должно быть заполнено',
            }),
            description: Joi.string().required().messages({
                'string.empty': 'Поле "description" должно быть заполнено',
            }),
            price: Joi.number().allow(null),
        })
        .unknown(false),
})

export const validateProductUpdateBody = validateRequest({
    body: Joi.object()
        .keys({
            title: Joi.string().min(2).max(30).messages({
                'string.min': 'Минимальная длина поля "name" - 2',
                'string.max': 'Максимальная длина поля "name" - 30',
            }),
            image: productImageSchema,
            category: Joi.string(),
            description: Joi.string(),
            price: Joi.number().allow(null),
        })
        .min(1)
        .unknown(false),
})

export const validateObjId = validateRequest({
    params: Joi.object().keys({
        productId: Joi.string()
            .required()
            .custom((value, helpers) => {
                if (Types.ObjectId.isValid(value)) {
                    return value
                }
                return helpers.message({ any: 'Невалидный id' })
            }),
    }),
})

export const validateCustomerId = validateRequest({
    params: Joi.object().keys({
        id: Joi.string()
            .required()
            .custom((value, helpers) => {
                if (Types.ObjectId.isValid(value)) {
                    return value
                }
                return helpers.message({ any: 'Невалидный id' })
            }),
    }),
})

export const validateUserBody = validateRequest({
    body: Joi.object()
        .keys({
            name: Joi.string().required().min(2).max(30).messages({
                'string.min': 'Минимальная длина поля "name" - 2',
                'string.max': 'Максимальная длина поля "name" - 30',
                'string.empty': 'Поле "name" должно быть заполнено',
            }),
            password: Joi.string().min(6).max(128).required().messages({
                'string.empty': 'Поле "password" должно быть заполнено',
            }),
            email: Joi.string()
                .required()
                .email()
                .max(254)
                .message('Поле "email" должно быть валидным email-адресом')
                .messages({
                    'string.empty': 'Поле "email" должно быть заполнено',
                }),
        })
        .unknown(false),
})

export const validateUserUpdateBody = validateRequest({
    body: Joi.object()
        .keys({
            name: Joi.string().min(2).max(30).messages({
                'string.min': 'Минимальная длина поля "name" - 2',
                'string.max': 'Максимальная длина поля "name" - 30',
            }),
            email: Joi.string()
                .email()
                .message('Поле "email" должно быть валидным email-адресом'),
            phone: Joi.string().pattern(phoneRegExp),
        })
        .min(1)
        .unknown(false),
})

export const validateAuthentication = validateRequest({
    body: Joi.object()
        .keys({
            email: Joi.string()
                .required()
                .email()
                .max(254)
                .message('Поле "email" должно быть валидным email-адресом')
                .messages({
                    'string.required': 'Поле "email" должно быть заполнено',
                }),
            password: Joi.string().max(128).required().messages({
                'string.empty': 'Поле "password" должно быть заполнено',
            }),
        })
        .unknown(false),
})
