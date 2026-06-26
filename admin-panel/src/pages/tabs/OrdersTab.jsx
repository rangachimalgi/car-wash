import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'
import OrdersManagement from '../../OrdersManagement'

export default function OrdersTab() {
  const { creditCustomerWallet, employees, loadingOrders, markOrderDelivered, orders, resolveUploadOrAbsoluteUrl, selectedOrderId, setSelectedOrderId } = useAdminPanelContext()

  return (
      <OrdersManagement
        orders={orders}
        loadingOrders={loadingOrders}
        selectedOrderId={selectedOrderId}
        onSelectOrder={setSelectedOrderId}
        employees={employees}
        onMarkDelivered={markOrderDelivered}
        onCreditWallet={creditCustomerWallet}
        resolveUploadUrl={resolveUploadOrAbsoluteUrl}
      />
  )
}
