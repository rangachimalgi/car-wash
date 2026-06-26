import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'
import RevenueDashboard from '../../RevenueDashboard'

export default function RevenueTab() {
  const {
    employees,
    inventory,
    loadingEmployees,
    loadingInventory,
    loadingOrders,
    loadingRefillRequests,
    loadingReviews,
    orders,
    pendingRefillCount,
    refillRequests,
    reviews,
  } = useAdminPanelContext()

  return (
    <RevenueDashboard
      orders={orders}
      employees={employees}
      inventory={inventory}
      reviews={reviews}
      refillRequests={refillRequests}
      pendingRefillCount={pendingRefillCount}
      loadingOrders={loadingOrders}
      loadingEmployees={loadingEmployees}
      loadingInventory={loadingInventory}
      loadingReviews={loadingReviews}
      loadingRefillRequests={loadingRefillRequests}
    />
  )
}
