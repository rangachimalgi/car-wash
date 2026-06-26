import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function PlaceholderTab({ activeTab }) {
  const admin = useAdminPanelContext()

  if (activeTab === 'employeeAvailability') {
  return (
    <div className="info-text">
      <h2>Employee availability</h2>
      <p>Coming soon. Use the Employees and Attendance sections for now.</p>
    </div>
  )
  }

  if (activeTab === 'inventoryAlert') {
    const lowStock = (admin.inventory || []).filter((item) => item.isLowStock)
    return (
      <div className="inventory-section">
        <h2>Inventory alert</h2>
        {lowStock.length === 0 ? (
          <p className="info-text">No low stock items right now.</p>
        ) : (
          <ul>
            {lowStock.map((item) => (
              <li key={item._id}>{item.name} — {item.currentStock} {item.unit}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return <div className="info-text">Page not found.</div>
}
