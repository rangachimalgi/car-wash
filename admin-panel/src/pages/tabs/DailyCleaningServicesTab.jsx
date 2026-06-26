import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function DailyCleaningServicesTab() {
  const { handlePackagePricingSubmit, loadingPackagePricing, message, packagePricingForm, packagePricingMessage, setPackagePricingForm, timeSlots } = useAdminPanelContext()

  return (
      <div className="daily-cleaning-page">
        <div className="form-section daily-cleaning-section">
          <div className="section-header daily-cleaning-header">
            <div>
              <h2 className="section-title daily-cleaning-title">Customer App Monthly Package Pricing</h2>
              <p className="daily-cleaning-subtitle">Configure slots and pricing matrix for daily cleaning plans</p>
            </div>
          </div>
          <form onSubmit={handlePackagePricingSubmit} className="form daily-cleaning-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="packageDurationDays">Package Duration (days)</label>
                <input
                  id="packageDurationDays"
                  type="number"
                  min="1"
                  value={packagePricingForm.durationDays}
                  onChange={(e) =>
                    setPackagePricingForm((prev) => ({ ...prev, durationDays: e.target.value }))
                  }
                  required
                />
              </div>
            </div>


            <div className="form-group">
              <label>Time Slots</label>
              <div className="form-row daily-time-slots-grid">
                {packagePricingForm.timeSlots.map((slot, idx) => (
                  <div key={`slot-${idx}`} className="form-group">
                    <input
                      type="text"
                      value={slot}
                      onChange={(e) => {
                        const next = [...packagePricingForm.timeSlots]
                        next[idx] = e.target.value
                        setPackagePricingForm((prev) => ({ ...prev, timeSlots: next }))
                      }}
                      placeholder={`Slot ${idx + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>


            <div className="form-group">
              <label>Pricing Matrix</label>
              <div className="form-row daily-pricing-grid">
                {[
                  { key: 'i1_e1_daily', label: 'I1 + E1 + Daily' },
                  { key: 'i1_e1_alternate', label: 'I1 + E1 + Alternate' },
                  { key: 'i1_e2_daily', label: 'I1 + E2 + Daily' },
                  { key: 'i1_e2_alternate', label: 'I1 + E2 + Alternate' },
                  { key: 'i2_e1_daily', label: 'I2 + E1 + Daily' },
                  { key: 'i2_e1_alternate', label: 'I2 + E1 + Alternate' },
                  { key: 'i2_e2_daily', label: 'I2 + E2 + Daily' },
                  { key: 'i2_e2_alternate', label: 'I2 + E2 + Alternate' },
                ].map((item) => (
                  <div key={item.key} className="form-group">
                    <label htmlFor={item.key}>{item.label}</label>
                    <input
                      id={item.key}
                      type="number"
                      min="0"
                      step="1"
                      value={packagePricingForm.pricingMatrix[item.key]}
                      onChange={(e) =>
                        setPackagePricingForm((prev) => ({
                          ...prev,
                          pricingMatrix: { ...prev.pricingMatrix, [item.key]: e.target.value },
                        }))
                      }
                      required
                    />
                  </div>
                ))}
              </div>
            </div>


            {packagePricingMessage.text ? (
              <div className={`message ${packagePricingMessage.type}`}>{packagePricingMessage.text}</div>
            ) : null}


            <div className="form-actions">
              <button type="submit" className="submit-button" disabled={loadingPackagePricing}>
                {loadingPackagePricing ? 'Saving...' : 'Save Package Pricing'}
              </button>
            </div>
          </form>
        </div>
      </div>
  )
}
