import { useCallback, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export type Route = {
    page: 'home'
}

const useRoute = () => {
    const location = useLocation()
    const navigate = useNavigate()
    // const p = location.pathname
    const search = location.search
    // const searchParams = useMemo(() => new URLSearchParams(search), [search])
    const route: Route = useMemo(() => {
        return {
            page: 'home'
        }
    }, [])

    const setRoute = useCallback((r: Route) => {
        // const queries: string[] = []
        // const queryString = queries.length > 0 ? `?${queries.join('&')}` : ''
        if (r.page === 'home') {
            navigate('/' + search)
        }
    }, [navigate, search])

    return {
        route,
        setRoute
    }
}

export default useRoute