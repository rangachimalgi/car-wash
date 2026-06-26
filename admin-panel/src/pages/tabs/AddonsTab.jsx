import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function AddonsTab() {
  const { addOnFilter, addOnFormData, addOnMessage, editingAddOnId, filteredAddOns, handleAddOnChange, handleAddOnSubmit, handleDeleteAddOn, handleNewAddOn, loading, loadingAddOn, loadingAllAddOns, message, setAddOnFilter, setAddOnFormData, setAddOnMessage, setEditingAddOnId } = useAdminPanelContext()

  return (
      <div className="addons-page">
        {/* Create Add-On Form */}
        <div className="form-section form-section-flat addons-form-section">
          <div className="section-header addons-form-header">
            <div>
              <h2 className="section-title addons-form-title">
                {editingAddOnId ? 'Edit Add-On' : 'Create New Add-On'}
              </h2>
              <p className="addons-form-subtitle">Create extras for customer wash services</p>
              {editingAddOnId && (
                <p className="addons-form-editing-note" style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Editing selected item — choose Save to apply changes
                </p>
              )}
            </div>
            {editingAddOnId && (
              <button type="button" className="secondary-button" onClick={handleNewAddOn}>
                + Create New
              </button>
            )}
          </div>
          <form onSubmit={handleAddOnSubmit} className="form">
        <div className="form-group">
          <label htmlFor="addon-name">Add-On Name *</label>
          <input
            type="text"
            id="addon-name"
            name="name"
            value={addOnFormData.name}
            onChange={handleAddOnChange}
            required
            placeholder="e.g., Interior Vacuum"
          />
        </div>


        <div className="form-row">
          <div className="form-group">
            <label htmlFor="addon-price">Price (₹) *</label>
            <input
              type="number"
              id="addon-price"
              name="basePrice"
              value={addOnFormData.basePrice}
              onChange={handleAddOnChange}
              required
              min="0"
              step="0.01"
              placeholder="99"
            />
          </div>


          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={addOnFormData.isActive}
                onChange={handleAddOnChange}
              />
              Active
            </label>
          </div>
        </div>




        <div className="form-group">
          <label>Applicable For *</label>
          <div className="checkbox-group-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="applicableFor"
                value="CarWash"
                checked={addOnFormData.applicableFor.includes('CarWash')}
                onChange={handleAddOnChange}
              />
              Car Wash
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="applicableFor"
                value="BikeWash"
                checked={addOnFormData.applicableFor.includes('BikeWash')}
                onChange={handleAddOnChange}
              />
              Bike Wash
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="applicableFor"
                value="AutoWash"
                checked={addOnFormData.applicableFor.includes('AutoWash')}
                onChange={handleAddOnChange}
              />
              Auto Wash
            </label>
          </div>
          <small className="help-text">Select which service types can use this add-on</small>
        </div>


        {addOnMessage.text && (
          <div className={`message ${addOnMessage.type}`}>
            {addOnMessage.text}
          </div>
        )}


        <div className="form-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="submit"
            className={`submit-button ${editingAddOnId ? '' : 'submit-button-create'}`.trim()}
            disabled={loadingAddOn}
          >
            {loadingAddOn
              ? (editingAddOnId ? 'Saving...' : 'Creating...')
              : (editingAddOnId ? 'Save Add-On' : 'Create Add-On')}
          </button>
          {editingAddOnId && (
            <button type="button" className="cancel-button" onClick={handleNewAddOn} disabled={loadingAddOn}>
              Cancel
            </button>
          )}
        </div>
          </form>
        </div>


        <div className="form-section-divider"></div>


        {/* Add-Ons List Section */}
        <div className="addons-list-section addons-list-section-modern">
          <div className="section-header addons-list-header">
            <div>
              <h2 className="section-title">Existing Add-Ons</h2>
              <p className="addons-list-subtitle">{filteredAddOns.length} shown</p>
            </div>
            <div className="addons-filter-tabs">
              <button
                type="button"
                className={`addons-filter-tab ${addOnFilter === 'car' ? 'active' : ''}`}
                onClick={() => setAddOnFilter('car')}
              >
                Car Wash
              </button>
              <button
                type="button"
                className={`addons-filter-tab ${addOnFilter === 'bike' ? 'active' : ''}`}
                onClick={() => setAddOnFilter('bike')}
              >
                Bike Wash
              </button>
              <button
                type="button"
                className={`addons-filter-tab ${addOnFilter === 'auto' ? 'active' : ''}`}
                onClick={() => setAddOnFilter('auto')}
              >
                Auto Wash
              </button>
            </div>
          </div>


          {loadingAllAddOns ? (
            <div className="loading-text">Loading add-ons...</div>
          ) : filteredAddOns.length === 0 ? (
            <div className="info-text">No add-ons found for this filter.</div>
          ) : (
            <div className="addons-clean-list">
              {filteredAddOns.map(addOn => (
                <div key={addOn._id} className="addon-list-row">
                  <div className="addon-list-main">
                    <h3 className="addon-list-name">{addOn.name}</h3>
                    <span className="addon-list-applicable">
                      {addOn.applicableFor && addOn.applicableFor.length > 0
                        ? addOn.applicableFor
                            .map(cat => (
                              cat === 'CarWash'
                                ? 'Car Wash'
                                : cat === 'BikeWash'
                                  ? 'Bike Wash'
                                  : cat === 'AutoWash'
                                    ? 'Auto Wash'
                                    : cat
                            ))
                            .join(', ')
                        : 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <div className="addon-list-meta">
                      <span className="addon-list-price">₹{addOn.basePrice}</span>
                      <span className={`addon-status ${addOn.isActive ? 'active' : 'inactive'}`}>
                        {addOn.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="addon-list-actions" style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddOnId(addOn._id)
                          setAddOnFormData({
                            name: addOn.name || '',
                            basePrice: addOn.basePrice != null ? String(addOn.basePrice) : '',
                            isActive: addOn.isActive !== false,
                            applicableFor: Array.isArray(addOn.applicableFor) ? [...addOn.applicableFor] : [],
                          })
                          setAddOnMessage({ type: '', text: '' })
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        style={{
                          width: '30px',
                          height: '30px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          backgroundColor: '#111827',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                        }}
                        aria-label="Edit add-on"
                        title="Edit add-on"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M4 20.5h4.2L19.2 9.5l-4-4L4 16.4V20.5z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                          <path d="M15 5.5l3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddOn(addOn)}
                        style={{
                          width: '30px',
                          height: '30px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          backgroundColor: '#DC2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                        }}
                        aria-label="Delete add-on"
                        title="Delete add-on"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M3.5 6.5h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M8 6.5V5a1.5 1.5 0 011.5-1.5h5A1.5 1.5 0 0116 5v1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M6.5 6.5l1 13a1.5 1.5 0 001.5 1.4h6a1.5 1.5 0 001.5-1.4l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M10 10.5v6M14 10.5v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
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
