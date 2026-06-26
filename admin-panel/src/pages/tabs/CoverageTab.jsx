import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function CoverageTab() {
  const { coverageFilter, coverageFormData, coverageMessage, editingCoverageId, filteredCoverage, handleCoverageChange, handleCoverageSubmit, handleDeleteCoverage, handleNewCoverage, loading, loadingAllCoverage, loadingCoverage, message, setCoverageFilter, setCoverageFormData, setCoverageMessage, setEditingCoverageId } = useAdminPanelContext()

  return (
      <div className="coverage-page">
        {/* Create Coverage Form */}
        <div className="form-section form-section-flat coverage-form-section">
          <div className="section-header coverage-form-header">
            <div>
              <h2 className="section-title coverage-form-title">
                {editingCoverageId ? 'Edit Coverage Item' : 'Create Coverage Item'}
              </h2>
              <p className="coverage-form-subtitle">Define what each wash service includes</p>
              {editingCoverageId && (
                <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Editing selected item — choose Save to apply changes
                </p>
              )}
            </div>
            {editingCoverageId && (
              <button type="button" className="secondary-button" onClick={handleNewCoverage}>
                + Create New
              </button>
            )}
          </div>
          <form onSubmit={handleCoverageSubmit} className="form">
          <div className="form-group">
            <label htmlFor="coverage-name">Coverage Name *</label>
            <input
              type="text"
              id="coverage-name"
              name="name"
              value={coverageFormData.name}
              onChange={handleCoverageChange}
              required
              placeholder="e.g., Exterior Wash"
            />
          </div>


          <div className="form-row">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={coverageFormData.isActive}
                  onChange={handleCoverageChange}
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
                  checked={coverageFormData.applicableFor.includes('CarWash')}
                  onChange={handleCoverageChange}
                />
                Car Wash
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="applicableFor"
                  value="BikeWash"
                  checked={coverageFormData.applicableFor.includes('BikeWash')}
                  onChange={handleCoverageChange}
                />
                Bike Wash
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="applicableFor"
                  value="AutoWash"
                  checked={coverageFormData.applicableFor.includes('AutoWash')}
                  onChange={handleCoverageChange}
                />
                Auto Wash
              </label>
            </div>
            <small className="help-text">Select which service types use this coverage</small>
          </div>


          {coverageMessage.text && (
            <div className={`message ${coverageMessage.type}`}>
              {coverageMessage.text}
            </div>
          )}


          <div className="form-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="submit"
              className={`submit-button ${editingCoverageId ? '' : 'submit-button-create'}`.trim()}
              disabled={loadingCoverage}
            >
              {loadingCoverage
                ? (editingCoverageId ? 'Saving...' : 'Creating...')
                : (editingCoverageId ? 'Save Coverage' : 'Create Coverage')}
            </button>
            {editingCoverageId && (
              <button type="button" className="cancel-button" onClick={handleNewCoverage} disabled={loadingCoverage}>
                Cancel
              </button>
            )}
          </div>
          </form>
        </div>


        <div className="form-section-divider"></div>


        {/* Coverage List Section */}
        <div className="addons-list-section addons-list-section-modern">
          <div className="section-header coverage-list-header">
            <div>
              <h2 className="section-title">Existing Coverage Items</h2>
              <p className="coverage-list-subtitle">{filteredCoverage.length} shown</p>
            </div>
            <div className="coverage-filter-tabs">
              <button
                type="button"
                className={`coverage-filter-tab ${coverageFilter === 'car' ? 'active' : ''}`}
                onClick={() => setCoverageFilter('car')}
              >
                Car Wash
              </button>
              <button
                type="button"
                className={`coverage-filter-tab ${coverageFilter === 'bike' ? 'active' : ''}`}
                onClick={() => setCoverageFilter('bike')}
              >
                Bike Wash
              </button>
              <button
                type="button"
                className={`coverage-filter-tab ${coverageFilter === 'auto' ? 'active' : ''}`}
                onClick={() => setCoverageFilter('auto')}
              >
                Auto Wash
              </button>
            </div>
          </div>


          {loadingAllCoverage ? (
            <div className="loading-text">Loading coverage items...</div>
          ) : filteredCoverage.length === 0 ? (
            <div className="info-text">No coverage items found for this filter.</div>
          ) : (
            <div className="addons-clean-list">
              {filteredCoverage.map(item => (
                <div key={item._id} className="addon-list-row">
                  <div className="addon-list-main">
                    <h3 className="addon-list-name">{item.name}</h3>
                    <span className="addon-list-applicable">
                      {item.applicableFor && item.applicableFor.length > 0
                        ? item.applicableFor
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
                      <span className={`addon-status ${item.isActive ? 'active' : 'inactive'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="addon-list-actions" style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCoverageId(item._id)
                          setCoverageFormData({
                            name: item.name || '',
                            isActive: item.isActive !== false,
                            applicableFor: Array.isArray(item.applicableFor) ? [...item.applicableFor] : [],
                          })
                          setCoverageMessage({ type: '', text: '' })
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
                        aria-label="Edit coverage item"
                        title="Edit coverage item"
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
                        onClick={() => handleDeleteCoverage(item)}
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
                        aria-label="Delete coverage item"
                        title="Delete coverage item"
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
