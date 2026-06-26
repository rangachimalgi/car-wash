import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function ReviewsTab() {
  const { fetchReviews, loading, loadingReviews, orders, reviews } = useAdminPanelContext()

  return (
      <div className="orders-section">
        <div className="section-header">
          <h2 className="section-title">Customer Reviews</h2>
          <button
            type="button"
            className="secondary-button"
            onClick={fetchReviews}
            disabled={loadingReviews}
          >
            {loadingReviews ? 'Loading...' : 'Refresh'}
          </button>
        </div>


        {loadingReviews ? (
          <div className="loading-text">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="info-text">No reviews yet.</div>
        ) : (
          <div className="reviews-table-wrap">
            <table className="reviews-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Service</th>
                  <th>Rating</th>
                  <th>Review</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((order) => {
                  const serviceName = order.items?.[0]?.serviceName || order.items?.[0]?.service?.name || '—'
                  const customerName = order.customer?.name || order.user?.name || '—'
                  const customerPhone = order.customer?.phone || order.user?.phone || '—'
                  return (
                    <tr key={order._id}>
                      <td>{customerName}</td>
                      <td>{customerPhone}</td>
                      <td>{serviceName}</td>
                      <td>
                        <span className="review-rating">
                          {'★'.repeat(order.rating || 0)}{'☆'.repeat(5 - (order.rating || 0))} {order.rating}/5
                        </span>
                      </td>
                      <td className="review-text">{order.review || '—'}</td>
                      <td>{order.ratedAt ? new Date(order.ratedAt).toLocaleString() : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
  )
}
