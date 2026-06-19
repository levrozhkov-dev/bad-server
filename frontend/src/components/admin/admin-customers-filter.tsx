import { useActionCreators, useDispatch, useSelector } from '@store/hooks'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    customersActions,
    customersSelector,
} from '../../services/slice/customers'
import type { FiltersCustomers } from '../../services/slice/customers/type'
import { fetchCustomersWithFilters } from '../../services/slice/customers/thunk'
import { AppRoute } from '../../utils/constants'
import Filter from '../filter'
import type { FilterValues } from '../filter/filter'
import styles from './admin.module.scss'
import { customersFilterFields } from './helpers/customersFilterFields'

export default function AdminFilterCustomers() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [_, setSearchParams] = useSearchParams()
    const { updateFilter, clearFilters } = useActionCreators(customersActions)
    const filterCustomersOption = useSelector(
        customersSelector.selectFilterOption
    )

    const handleFilter = (filters: FilterValues) => {
        dispatch(updateFilter({ ...filters } as Partial<FiltersCustomers>))
        const queryParams: { [key: string]: string } = {}
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                const filterValue =
                    typeof value === 'object' ? value.value : value
                queryParams[key] = filterValue.toString()
            }
        })
        setSearchParams(queryParams)
        navigate(
            `${AppRoute.AdminCustomers}?${new URLSearchParams(
                queryParams
            ).toString()}`
        )
    }

    const handleClearFilters = () => {
        dispatch(clearFilters())
        setSearchParams({})
        dispatch(fetchCustomersWithFilters({}))
        navigate(AppRoute.AdminCustomers)
    }

    return (
        <>
            <h2 className={styles.admin__title}>Фильтры</h2>
            <Filter
                fields={customersFilterFields}
                onFilter={handleFilter}
                defaultValue={filterCustomersOption}
                onClear={handleClearFilters}
            />
        </>
    )
}
