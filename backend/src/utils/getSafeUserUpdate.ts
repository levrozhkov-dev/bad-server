import { IUser } from '../models/user'

type UserUpdate = Partial<Pick<IUser, 'email' | 'name' | 'phone'>>

const allowedUserUpdateFields: (keyof UserUpdate)[] = ['email', 'name', 'phone']

export default function getSafeUserUpdate(body: Record<string, unknown>) {
    const update: UserUpdate = {}

    allowedUserUpdateFields.forEach((field) => {
        const value = body[field]
        if (typeof value === 'string') {
            update[field] = value
        }
    })

    return update
}
