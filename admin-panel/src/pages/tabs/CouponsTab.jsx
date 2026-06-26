import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function CouponsTab() {
  const { couponForm, couponMessage, coupons, fetchCoupons, handleCreateCoupon, loading, loadingCoupons, message, orders, setCouponForm } = useAdminPanelContext()

  return (
      <div className="coupons-page">
        <div className="form-section coupons-form-section">
          <div className="section-header coupons-header">
            <div>
              <h2 className="section-title coupons-title">Create Woosh Coin</h2>
              <p className="coupons-subtitle">Add discount codes for customer orders</p>
            </div>
          </div>
          <form onSubmit={handleCreateCoupon} className="form coupons-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="couponCode">Code *</label>
                <input
                  id="couponCode"
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="SAVE50"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="couponValue">Discount Value *</label>
                <input
                  id="couponValue"
                  type="number"
                  min="1"
                  value={couponForm.discountValue}
                  onChange={(e) => setCouponForm((p) => ({ ...p, discountValue: e.target.value }))}
                  placeholder="50"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="couponPerUserLimit">Per User Limit</label>
                <input
                  id="couponPerUserLimit"
                  type="number"
                  min="0"
                  value={couponForm.perUserLimit}
                  onChange={(e) => setCouponForm((p) => ({ ...p, perUserLimit: e.target.value }))}
                  placeholder="1"
                />
              </div>
            </div>


            {couponMessage.text && (
              <div className={`message ${couponMessage.type}`}>
                {couponMessage.text}
              </div>
            )}


            <div className="form-actions">
              <button type="submit" className="submit-button">Create Woosh Coin</button>
            </div>
          </form>
        </div>


        <div className="services-section coupons-list-section">
          <div className="section-header coupons-list-header">
            <div>
              <h2 className="section-title">All Woosh Coins</h2>
              <p className="coupons-list-subtitle">{coupons.length} total</p>
            </div>
            <button type="button" className="refresh-button coupons-refresh-button" onClick={fetchCoupons} disabled={loadingCoupons}>
              {loadingCoupons ? 'Loading...' : 'Refresh'}
            </button>
          </div>


          {loadingCoupons ? (
            <div className="loading-text">Loading Woosh Coins...</div>
          ) : coupons.length === 0 ? (
            <div className="info-text">No Woosh Coins created yet.</div>
          ) : (
            <div className="addons-grid">
              {coupons.map((coupon) => (
                <div key={coupon._id} className="addon-card coupon-card">
                  <div className="addon-card-header">
                    <h3 className="addon-card-title">{coupon.code}</h3>
                    <span className={`addon-status ${coupon.isActive ? 'active' : 'inactive'}`}>
                      {coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="addon-card-details">
                    <div className="detail-item">
                      <span className="detail-label">Discount</span>
                      <span className="detail-value">
                        {coupon.discountType === 'FLAT' ? `₹${coupon.discountValue}` : `${coupon.discountValue}%`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Min order</span>
                      <span className="detail-value">₹{coupon.minOrderAmount || 0}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Used</span>
                      <span className="detail-value">
                        {coupon.usedCount || 0}{coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ''}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Expiry</span>
                      <span className="detail-value">
                        {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No expiry'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  )
}
