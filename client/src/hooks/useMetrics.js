import { useState, useEffect, useCallback } from 'react'

export function useMetrics(range = '24h', abVariant = 'all') {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    try {
      const params = new URLSearchParams({ range, ab_variant: abVariant })
      const res  = await fetch(`/api/metrics?${params}`)
      const data = await res.json()
      setMetrics(data)
    } catch (e) {
      console.error('Metrics fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [range, abVariant])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  return { metrics, loading, refetch: fetchMetrics }
}
