export default function getSafeSort<T extends string>(
    sortField: unknown,
    sortOrder: unknown,
    allowedFields: readonly T[],
    defaultField: T
) {
    const field =
        typeof sortField === 'string' && allowedFields.includes(sortField as T)
            ? sortField
            : defaultField

    return {
        [field]: sortOrder === 'asc' ? 1 : -1,
    }
}
