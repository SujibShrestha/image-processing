import { useEffect, useRef, useState, type DependencyList } from 'react'
import { getErrorMessage } from '@/lib/errors'

export function useFetch<T>(fetcher: () => Promise<T>, deps: DependencyList = [], immediate = true) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(immediate)
  const fetcherRef = useRef(fetcher)

  fetcherRef.current = fetcher

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetcherRef.current()
      setData(result)
      return result
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!immediate) {
      return
    }

    void load()
  }, [immediate, ...deps])

  return { data, error, loading, refetch: load, setData }
}
