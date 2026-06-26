import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function ActiveWashesTab() {
  const { completedOrders, fetchOrders, loading, loadingOrders, orders, pendingOrders } = useAdminPanelContext()

  return (
      <div className="active-washes-page">
        <div className="orders-section orders-section-modern">
          <div className="section-header orders-header">
            <div>
              <h2 className="section-title orders-title">Active Washes</h2>
              <p className="orders-subtitle">Pending and completed orders with details</p>
            </div>
            <button
              type="button"
              className="secondary-button orders-refresh-button"
              onClick={fetchOrders}
            >
              Refresh
            </button>
          </div>


          {loadingOrders ? (
            <div className="loading-text">Loading active washes...</div>
          ) : (
            <>
              <div className="active-washes-summary-grid">
                <div className="active-washes-summary-card pending">
                  <span className="active-washes-summary-label">Pending Orders</span>
                  <strong className="active-washes-summary-value">{pendingOrders.length}</strong>
                </div>
                <div className="active-washes-summary-card completed">
                  <span className="active-washes-summary-label">Completed Orders</span>
                  <strong className="active-washes-summary-value">{completedOrders.length}</strong>
                </div>
              </div>


              <div className="active-washes-grid">
                <div className="active-washes-column">
                  <div className="active-washes-column-header pending">
                    <h3>Pending Orders</h3>
                    <span>{pendingOrders.length}</span>
                  </div>
                  <div className="active-washes-list">
                    {pendingOrders.length === 0 ? (
                      <div className="info-text">No pending orders.</div>
                    ) : pendingOrders.map((order) => (
                      <div key={order._id} className="active-wash-card">
                        <div className="active-wash-card-top">
                          <strong>#{order._id?.slice(-6) || '—'}</strong>
                          <span className={`order-status ${String(order.status || '').toLowerCase()}`}>{order.status || 'Pending'}</span>
                        </div>
                        <div className="active-wash-meta">
                          <span>{order.customer?.name || '—'}</span>
                          <span>{order.customer?.phone || '—'}</span>
                          <span>₹{Number(order.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="active-wash-items">
                          {(order.items || []).map((item, idx) => (
                            <div key={`${order._id}-pending-item-${idx}`} className="active-wash-item-row">
                              <span>{item?.serviceName || item?.service?.name || 'Service'}</span>
                              <span>{item?.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : '—'} {item?.scheduledTimeSlot || ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>


                <div className="active-washes-column">
                  <div className="active-washes-column-header completed">
                    <h3>Completed Orders</h3>
                    <span>{completedOrders.length}</span>
                  </div>
                  <div className="active-washes-list">
                    {completedOrders.length === 0 ? (
                      <div className="info-text">No completed orders.</div>
                    ) : completedOrders.map((order) => (
                      <div key={order._id} className="active-wash-card completed">
                        <div className="active-wash-card-top">
                          <strong>#{order._id?.slice(-6) || '—'}</strong>
                          <span className={`order-status ${String(order.status || '').toLowerCase()}`}>{order.status || 'Completed'}</span>
                        </div>
                        <div className="active-wash-meta">
                          <span>{order.customer?.name || '—'}</span>
                          <span>{order.customer?.phone || '—'}</span>
                          <span>₹{Number(order.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="active-wash-items">
                          {(order.items || []).map((item, idx) => (
                            <div key={`${order._id}-completed-item-${idx}`} className="active-wash-item-row">
                              <span>{item?.serviceName || item?.service?.name || 'Service'}</span>
                              <span>{item?.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : '—'} {item?.scheduledTimeSlot || ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
  )
}
