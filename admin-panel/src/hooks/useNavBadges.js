import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/api'

export function useNavBadges() {
  const [pendingRefillCount, setPendingRefillCount] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [refillRes, inventoryRes] = await Promise.all([
          fetch(`${API_BASE_URL}/inventory/refill-requests?status=pending`),
          fetch(`${API_BASE_URL}/inventory?lowStock=true`),
        ])
        const refillData = await refillRes.json()
        const inventoryData = await inventoryRes.json()
        if (cancelled) return
        setPendingRefillCount(refillData.count ?? (refillData.data?.length ?? 0))
        setLowStockCount(inventoryData.data?.length ?? 0)
      } catch {
        // Nav badges are non-critical
      }
    }

    load()
    const interval = setInterval(load, 60000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const inventoryNavBadge = pendingRefillCount > 0 ? pendingRefillCount : lowStockCount

  return { inventoryNavBadge, pendingRefillCount, lowStockCount }
}
