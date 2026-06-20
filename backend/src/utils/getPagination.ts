const DEFAULT_LIMIT = 10
const MAX_LIMIT = 10

function getSafePositiveNumber(value: unknown, defaultValue: number) {
    const parsedValue = Number(value)

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
        return defaultValue
    }

    return parsedValue
}

export default function getPagination(
    pageValue: unknown,
    limitValue: unknown,
    defaultLimit = DEFAULT_LIMIT
) {
    const page = getSafePositiveNumber(pageValue, 1)
    const limit = Math.min(
        getSafePositiveNumber(limitValue, defaultLimit),
        MAX_LIMIT
    )

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    }
}
