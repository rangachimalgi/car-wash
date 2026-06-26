import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function SlotsTab() {
  const { addSlotToOverride, dailyOverrideMessage, dailyOverrideSlots, defaultSlotsCount, defaultStartHour, editingTimeSlotId, fetchTimeSlots, handleDeleteDailyOverride, handleDeleteTimeSlot, handleEditTimeSlot, handleNewTimeSlot, handleResetToDefaults, handleSaveDailyOverride, handleTimeSlotChange, handleTimeSlotSubmit, loadDailyOverride, loading, loadingDailyOverride, loadingTimeSlots, message, selectedOverrideDate, setDailyOverrideSlots, setDefaultSlotsCount, setDefaultStartHour, setSelectedOverrideDate, timeSlotFormData, timeSlotMessage, timeSlots, timeSlotsError } = useAdminPanelContext()

  return (
      <>
        {/* Default Slots Configuration */}
        <div className="services-section">
          <div className="section-header">
            <h2 className="section-title">Default Time Slots</h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Slots:</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={defaultSlotsCount}
                  onChange={(e) => setDefaultSlotsCount(parseInt(e.target.value) || 10)}
                  style={{
                    width: '60px',
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Start:</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={defaultStartHour}
                  onChange={(e) => setDefaultStartHour(parseInt(e.target.value) || 9)}
                  style={{
                    width: '60px',
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                  }}
                />
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>AM</span>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={handleResetToDefaults}
                disabled={loadingTimeSlots}
                title="Reset to default slots"
              >
                🔄 Reset to Defaults
              </button>
              <button
                type="button"
                className="refresh-button"
                onClick={fetchTimeSlots}
                disabled={loadingTimeSlots}
                title="Refresh slots list"
              >
                <span className="refresh-icon">↻</span>
                {loadingTimeSlots ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>


          {timeSlotsError ? (
            <div className="message error">
              {timeSlotsError}
              <button type="button" className="secondary-button" style={{ marginTop: '10px' }} onClick={fetchTimeSlots}>
                Retry
              </button>
            </div>
          ) : loadingTimeSlots ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading time slots...</p>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⏰</div>
              <h3>No time slots configured</h3>
              <p>Create your first time slot below to get started.</p>
            </div>
          ) : (
            <>
              <div className="services-stats">
                {timeSlots.filter(s => s.isActive).length} active, {timeSlots.filter(s => !s.isActive).length} inactive
              </div>
              <div className="services-grid">
                {timeSlots.map(slot => (
                  <div key={slot._id} className="service-card">
                    <div className="service-card-content">
                      <div className="service-card-header">
                        <div className="service-card-title-row">
                          <span className="service-category-icon">⏰</span>
                          <h3 className="service-card-title">{slot.time}</h3>
                        </div>
                        <span className={`service-status ${slot.isActive ? 'active' : 'inactive'}`}>
                          {slot.isActive ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </div>
                  

                      <div className="service-card-details">
                        <div className="service-detail">
                          <span className="service-detail-icon">🕐</span>
                          <div>
                            <span className="service-detail-label">Start</span>
                            <span className="service-detail-value">{slot.startTime}</span>
                          </div>
                        </div>
                        <div className="service-detail">
                          <span className="service-detail-icon">🕑</span>
                          <div>
                            <span className="service-detail-label">End</span>
                            <span className="service-detail-value">{slot.endTime}</span>
                          </div>
                        </div>
                        <div className="service-detail">
                          <span className="service-detail-icon">#</span>
                          <div>
                            <span className="service-detail-label">Order</span>
                            <span className="service-detail-value">{slot.order}</span>
                          </div>
                        </div>
                      </div>
                  

                      <div className="service-card-actions">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => handleEditTimeSlot(slot._id)}
                        >
                          ✏️ Edit Slot
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          style={{ marginTop: '0.5rem', width: '100%' }}
                          onClick={() => handleDeleteTimeSlot(slot._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>


        {/* Create/Edit Time Slot Form */}
        <div className="form-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">
                {editingTimeSlotId ? '✏️ Edit Time Slot' : '➕ Create New Time Slot'}
              </h2>
              {editingTimeSlotId && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Editing slot
                </p>
              )}
            </div>
            {editingTimeSlotId && (
              <button
                type="button"
                className="secondary-button"
                onClick={handleNewTimeSlot}
              >
                + Create New
              </button>
            )}
          </div>
          <form onSubmit={handleTimeSlotSubmit} className="form">
            <div className="form-group">
              <label htmlFor="time">Time Slot Display *</label>
              <input
                type="text"
                id="time"
                name="time"
                value={timeSlotFormData.time}
                onChange={handleTimeSlotChange}
                required
                placeholder="e.g., 9:00 AM - 10:00 AM"
              />
              <small className="help-text">This is what customers will see</small>
            </div>


            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start Time (24h) *</label>
                <input
                  type="text"
                  id="startTime"
                  name="startTime"
                  value={timeSlotFormData.startTime}
                  onChange={handleTimeSlotChange}
                  required
                  placeholder="09:00"
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                />
                <small className="help-text">Format: HH:MM (24-hour)</small>
              </div>


              <div className="form-group">
                <label htmlFor="endTime">End Time (24h) *</label>
                <input
                  type="text"
                  id="endTime"
                  name="endTime"
                  value={timeSlotFormData.endTime}
                  onChange={handleTimeSlotChange}
                  required
                  placeholder="10:00"
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                />
                <small className="help-text">Format: HH:MM (24-hour)</small>
              </div>


              <div className="form-group">
                <label htmlFor="order">Display Order</label>
                <input
                  type="number"
                  id="order"
                  name="order"
                  value={timeSlotFormData.order}
                  onChange={handleTimeSlotChange}
                  min="1"
                  placeholder="Auto"
                />
                <small className="help-text">Lower numbers appear first (auto if empty)</small>
              </div>
            </div>


            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={timeSlotFormData.isActive}
                  onChange={handleTimeSlotChange}
                />
                Active (visible to customers)
              </label>
            </div>


            {timeSlotMessage.text && (
              <div className={`message ${timeSlotMessage.type}`}>
                {timeSlotMessage.text}
              </div>
            )}


            <div className="form-actions">
              <button type="submit" className="submit-button" disabled={loadingTimeSlots}>
                {loadingTimeSlots
                  ? (editingTimeSlotId ? 'Updating...' : 'Creating...')
                  : (editingTimeSlotId ? '💾 Update Slot' : '✨ Create Slot')}
              </button>
              {editingTimeSlotId && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleNewTimeSlot}
                  disabled={loadingTimeSlots}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>


        {/* Daily Slot Overrides */}
        <div className="form-section" style={{ marginTop: '2rem' }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">📅 Daily Slot Overrides</h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Override slots for specific dates (e.g., holidays, special events)
              </p>
            </div>
          </div>


          <form onSubmit={handleSaveDailyOverride} className="form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="override-date">Select Date *</label>
                <input
                  type="date"
                  id="override-date"
                  value={selectedOverrideDate}
                  onChange={(e) => {
                    setSelectedOverrideDate(e.target.value)
                    if (e.target.value) {
                      loadDailyOverride(e.target.value)
                    } else {
                      setDailyOverrideSlots([])
                    }
                  }}
                  required={false}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              {selectedOverrideDate && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={async () => {
                      try {
                        const slotsResponse = await fetch(`${API_BASE_URL}/slots/times`)
                        const slotsData = await slotsResponse.json()
                        if (slotsData.success && slotsData.data) {
                          setDailyOverrideSlots(slotsData.data.map(s => ({
                            time: s.time,
                            startTime: s.startTime,
                            endTime: s.endTime,
                            order: s.order || 0,
                          })))
                        } else {
                          const defaults = generateDefaultSlots(defaultSlotsCount, defaultStartHour)
                          setDailyOverrideSlots(defaults)
                        }
                      } catch (error) {
                        const defaults = generateDefaultSlots(defaultSlotsCount, defaultStartHour)
                        setDailyOverrideSlots(defaults)
                      }
                    }}
                  >
                    Use Defaults
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={handleDeleteDailyOverride}
                    disabled={loadingDailyOverride}
                  >
                    Remove Override
                  </button>
                </div>
              )}
            </div>


            {selectedOverrideDate && (
              <>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label>Slots for {new Date(selectedOverrideDate).toLocaleDateString()}</label>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={addSlotToOverride}
                    >
                      + Add Slot
                    </button>
                  </div>
                  {dailyOverrideSlots.length === 0 ? (
                    <div className="info-text" style={{ padding: '1rem', textAlign: 'center' }}>
                      No slots configured. Click "Use Defaults" or "Add Slot" to configure.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {dailyOverrideSlots.map((slot, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}>
                          <span style={{ flex: 1, fontWeight: '600' }}>{slot.time}</span>
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => removeSlotFromOverride(index)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                {dailyOverrideMessage.text && (
                  <div className={`message ${dailyOverrideMessage.type}`}>
                    {dailyOverrideMessage.text}
                  </div>
                )}


                <div className="form-actions">
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={loadingDailyOverride || dailyOverrideSlots.length === 0}
                  >
                    {loadingDailyOverride ? 'Saving...' : '💾 Save Override'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </>
  )
}
