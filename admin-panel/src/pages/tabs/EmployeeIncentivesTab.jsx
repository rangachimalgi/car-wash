import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function EmployeeIncentivesTab() {
  const { fetchIncentiveConfig, fetchUpsellConfig, handleIncentiveSubmit, handleUpsellSubmit, incentiveForm, incentiveMessage, loadingIncentiveConfig, loadingUpsellConfig, setIncentiveForm, setUpsellForm, upsellForm, upsellMessage } = useAdminPanelContext()

  return (
      <div className="services-section" style={{ maxWidth: 560 }}>
        <div className="section-header">
          <h2 className="section-title">Targets above baseline</h2>
          <button
            type="button"
            className="secondary-button"
            onClick={() => { fetchIncentiveConfig(); fetchUpsellConfig(); }}
            disabled={loadingIncentiveConfig || loadingUpsellConfig}
          >
            {loadingIncentiveConfig || loadingUpsellConfig ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>
          Periods use India time (IST). Each completed job after the target in that period earns the flat amount below.
          The employee app Earnings tab shows only these incentives.
        </p>
        {incentiveMessage.text ? (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: incentiveMessage.type === 'success' ? '#d4edda' : '#f8d7da',
              color: incentiveMessage.type === 'success' ? '#155724' : '#721c24',
            }}
          >
            {incentiveMessage.text}
          </div>
        ) : null}
        <form onSubmit={handleIncentiveSubmit}>
          <div className="form-group">
            <label>Period type</label>
            <select
              value={incentiveForm.periodType}
              onChange={(e) => setIncentiveForm((f) => ({ ...f, periodType: e.target.value }))}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
            >
              <option value="weekly">Weekly (week starts Monday, IST)</option>
              <option value="daily">Daily (calendar day, IST)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Target (services per period)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={incentiveForm.targetCount}
              onChange={(e) => setIncentiveForm((f) => ({ ...f, targetCount: e.target.value }))}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>
          <div className="form-group">
            <label>₹ per service above target</label>
            <input
              type="number"
              min={0}
              step={1}
              value={incentiveForm.amountPerExtraService}
              onChange={(e) => setIncentiveForm((f) => ({ ...f, amountPerExtraService: e.target.value }))}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>
          {incentiveForm.periodType === 'weekly' && (
            <div className="form-group">
              <label>Week starts on (date-fns: 0 = Sunday, 1 = Monday)</label>
              <select
                value={incentiveForm.weekStartsOn}
                onChange={(e) => setIncentiveForm((f) => ({ ...f, weekStartsOn: Number(e.target.value) }))}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
              >
                <option value={1}>Monday (recommended)</option>
                <option value={0}>Sunday</option>
              </select>
            </div>
          )}
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              id="incentiveActive"
              type="checkbox"
              checked={incentiveForm.isActive}
              onChange={(e) => setIncentiveForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <label htmlFor="incentiveActive" style={{ margin: 0 }}>Incentives active</label>
          </div>
          <button type="submit" className="primary-button" disabled={loadingIncentiveConfig}>
            {loadingIncentiveConfig ? 'Saving…' : 'Save'}
          </button>
        </form>


        <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #E2E8F0' }} />


        <h3 className="section-title" style={{ marginBottom: 12 }}>Add-on upsell commission (weekly)</h3>
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
          Employees earn the commission % on <strong>all</strong> add-on sales (pre-tax) in the IST week <strong>only if</strong> their weekly total reaches the sales target. Customer adds add-ons from Bookings → Add services.
        </p>
        {upsellMessage.text ? (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: upsellMessage.type === 'success' ? '#d4edda' : '#f8d7da',
              color: upsellMessage.type === 'success' ? '#155724' : '#721c24',
            }}
          >
            {upsellMessage.text}
          </div>
        ) : null}
        <form onSubmit={handleUpsellSubmit}>
          <div className="form-group">
            <label>Weekly sales target (₹, pre-tax add-ons)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={upsellForm.targetAmount}
              onChange={(e) => setUpsellForm((f) => ({ ...f, targetAmount: e.target.value }))}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>
          <div className="form-group">
            <label>Commission when target is reached (% of weekly add-on sales)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={upsellForm.commissionPercent}
              onChange={(e) => setUpsellForm((f) => ({ ...f, commissionPercent: e.target.value }))}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>
          <div className="form-group">
            <label>Week starts on</label>
            <select
              value={upsellForm.weekStartsOn}
              onChange={(e) => setUpsellForm((f) => ({ ...f, weekStartsOn: Number(e.target.value) }))}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
            >
              <option value={1}>Monday (IST)</option>
              <option value={0}>Sunday (IST)</option>
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              id="upsellActive"
              type="checkbox"
              checked={upsellForm.isActive}
              onChange={(e) => setUpsellForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <label htmlFor="upsellActive" style={{ margin: 0 }}>Upsell commission active</label>
          </div>
          <button type="submit" className="primary-button" disabled={loadingUpsellConfig}>
            {loadingUpsellConfig ? 'Saving…' : 'Save upsell rules'}
          </button>
        </form>
      </div>
  )
}
