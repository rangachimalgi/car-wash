import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function PackagesTab() {
  const { deletePackageCardRow, editingPackageCardIndex, handleCancelPackageCardEdit, handleClearPackageImage, handleClearPackagePanelImage, handleCreatePackageCard, handleEditPackageCard, handlePackageImageUpload, handlePackagePanelImageUpload, handlePackagePricingSubmit, loadingPackagePricing, message, newPackageCard, packageCarWashAddOns, packageCarWashCoverage, packagePricingForm, packagePricingMessage, resolveUploadOrAbsoluteUrl, setNewPackageCard, toggleNewPackageArrayValue, uploadingPackageImage, uploadingPackagePanelImage } = useAdminPanelContext()

  return (
      <div className="packages-page">
        <div className="form-section packages-section">
          <div className="section-header packages-header">
            <div>
              <h2 className="section-title packages-title">Customer App Packages</h2>
              <p className="packages-subtitle">Create and manage package cards for the customer app</p>
            </div>
          </div>


          <div className="form packages-form">
            <div className="section-header packages-form-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 className="packages-block-title" style={{ marginBottom: '4px' }}>
                  {editingPackageCardIndex != null ? 'Edit Package' : 'Create Package'}
                </h3>
                {editingPackageCardIndex != null ? (
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Editing selected package — update fields below, then save
                  </p>
                ) : null}
              </div>
              {editingPackageCardIndex != null ? (
                <button type="button" className="secondary-button" onClick={handleCancelPackageCardEdit}>
                  + Create New
                </button>
              ) : null}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Package Name</label>
                <input
                  type="text"
                  value={newPackageCard.name}
                  onChange={(e) => setNewPackageCard((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Premium Monthly"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newPackageCard.description}
                  onChange={(e) => setNewPackageCard((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Short package description"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Washes / Month</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={newPackageCard.times}
                  onChange={(e) => setNewPackageCard((prev) => ({ ...prev, times: e.target.value }))}
                  placeholder="2"
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newPackageCard.price}
                  onChange={(e) => setNewPackageCard((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="1499"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Package Image</label>
              <div className="service-upload-row">
                <label className="service-upload-button">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePackageImageUpload}
                    disabled={uploadingPackageImage}
                  />
                  {uploadingPackageImage ? 'Uploading...' : 'Upload Package Image'}
                </label>
                {newPackageCard.image ? (
                  <span className="service-upload-status">Uploaded</span>
                ) : (
                  <span className="service-upload-status muted">No image</span>
                )}
                {newPackageCard.image ? (
                  <button type="button" className="secondary-button" onClick={handleClearPackageImage}>
                    Clear
                  </button>
                ) : null}
              </div>
              {newPackageCard.image ? (
                <div className="package-image-preview-wrap">
                  <img
                    src={resolveUploadOrAbsoluteUrl(newPackageCard.image)}
                    alt="Package preview"
                    className="package-image-preview"
                  />
                  <small className="help-text">{newPackageCard.image}</small>
                </div>
              ) : (
                <small className="help-text">
                  Shown full-width on Monthly Packages cards (16:9 crop). Recommended upload:{' '}
                  <strong>1200×675 px</strong> (or 1600×900). JPG/WebP, subject centered — edges may crop on small phones.
                </small>
              )}
            </div>
            <div className="form-group">
              <label>Panel Image (View Details)</label>
              <small className="help-text" style={{ display: 'block', marginBottom: 8 }}>
                Tall image beside Add Services when the customer opens View Details on a monthly package.
              </small>
              <div className="service-upload-row">
                <label className="service-upload-button">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePackagePanelImageUpload}
                    disabled={uploadingPackagePanelImage}
                  />
                  {uploadingPackagePanelImage ? 'Uploading...' : 'Upload Panel Image'}
                </label>
                {newPackageCard.panelImage ? (
                  <span className="service-upload-status">Uploaded</span>
                ) : (
                  <span className="service-upload-status muted">No image</span>
                )}
                {newPackageCard.panelImage ? (
                  <button type="button" className="secondary-button" onClick={handleClearPackagePanelImage}>
                    Clear
                  </button>
                ) : null}
              </div>
              {newPackageCard.panelImage ? (
                <div className="package-image-preview-wrap">
                  <img
                    src={resolveUploadOrAbsoluteUrl(newPackageCard.panelImage)}
                    alt="Panel preview"
                    className="package-image-preview package-panel-preview"
                  />
                  <small className="help-text">{newPackageCard.panelImage}</small>
                </div>
              ) : (
                <small className="help-text">
                  Recommended: tall portrait image (e.g. <strong>600×900 px</strong> or 3:4). Same idea as Panel Image on Car/Bike wash services.
                </small>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Add-Ons</label>
                <div className="packages-checkbox-panel">
                  {(packageCarWashAddOns || []).length === 0 ? (
                    <small className="help-text">No add-ons available.</small>
                  ) : (
                    (packageCarWashAddOns || []).map((addOn) => (
                      <label key={addOn._id} className="packages-checkbox-row">
                        <input
                          type="checkbox"
                          checked={(newPackageCard.addOnServiceIds || []).includes(addOn._id)}
                          onChange={(e) => toggleNewPackageArrayValue('addOnServiceIds', addOn._id, e.target.checked)}
                        />
                        <span>{addOn.name} (₹{addOn.basePrice})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Coverage Included</label>
                <div className="packages-checkbox-panel">
                  {(packageCarWashCoverage || []).length === 0 ? (
                    <small className="help-text">No coverage items available.</small>
                  ) : (
                    (packageCarWashCoverage || []).map((coverage) => (
                      <label key={`new-inc-${coverage._id}`} className="packages-checkbox-row">
                        <input
                          type="checkbox"
                          checked={(newPackageCard.coverageIncluded || []).includes(coverage.name)}
                          onChange={(e) => toggleNewPackageArrayValue('coverageIncluded', coverage.name, e.target.checked)}
                        />
                        <span>{coverage.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Coverage Not Included</label>
                <div className="packages-checkbox-panel">
                  {(packageCarWashCoverage || []).length === 0 ? (
                    <small className="help-text">No coverage items available.</small>
                  ) : (
                    (packageCarWashCoverage || []).map((coverage) => (
                      <label key={`new-not-inc-${coverage._id}`} className="packages-checkbox-row">
                        <input
                          type="checkbox"
                          checked={(newPackageCard.coverageNotIncluded || []).includes(coverage.name)}
                          onChange={(e) => toggleNewPackageArrayValue('coverageNotIncluded', coverage.name, e.target.checked)}
                        />
                        <span>{coverage.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="form-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <button type="button" className="secondary-button" onClick={handleCreatePackageCard}>
                {editingPackageCardIndex != null ? 'Save Package' : '+ Add Package'}
              </button>
              {editingPackageCardIndex != null ? (
                <button type="button" className="cancel-button" onClick={handleCancelPackageCardEdit}>
                  Cancel
                </button>
              ) : null}
            </div>
          </div>


          <div className="form-section-divider"></div>


          <form onSubmit={handlePackagePricingSubmit} className="form packages-form">
            <h3 className="packages-block-title">Existing Packages</h3>
            {(packagePricingForm.packageCards || []).length === 0 ? (
              <div className="info-text">No packages added yet.</div>
            ) : (
              <div className="addons-clean-list">
                {(packagePricingForm.packageCards || []).map((card, index) => (
                  <div key={`pkg-${index}`} className="addon-list-row package-list-row">
                    {card.image ? (
                      <img
                        src={resolveUploadOrAbsoluteUrl(card.image)}
                        alt=""
                        className="package-list-thumb"
                      />
                    ) : null}
                    <div className="addon-list-main">
                      <h4 className="addon-list-name">{card.name || `Package ${index + 1}`}</h4>
                      <span className="addon-list-applicable">
                        {card.description || 'No description'}
                      </span>
                      <span className="addon-list-applicable">
                        {Number(card.times || 0)} washes/month | {Number(card.addOnServiceIds?.length || 0)} add-ons | {Number(card.coverageIncluded?.length || 0)} included | {Number(card.coverageNotIncluded?.length || 0)} not included
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <div className="addon-list-meta">
                        <span className="addon-list-price">₹{card.price || 0}</span>
                      </div>
                      <div className="addon-list-actions" style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditPackageCard(index)}
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
                          aria-label="Edit package"
                          title="Edit package"
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
                          onClick={() => deletePackageCardRow(index)}
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
                          aria-label="Delete package"
                          title="Delete package"
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


            {packagePricingMessage.text ? (
              <div className={`message ${packagePricingMessage.type}`}>{packagePricingMessage.text}</div>
            ) : null}


            <div className="form-actions">
              <button type="submit" className="submit-button" disabled={loadingPackagePricing}>
                {loadingPackagePricing ? 'Saving...' : 'Save Packages'}
              </button>
            </div>
          </form>
        </div>
      </div>
  )
}
