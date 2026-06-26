import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function ServicesTab() {
  const { allServices, availableAddOns, availableCoverage, categoryCounts, draggingServiceId, editingServiceId, fetchAllServices, filteredServices, formData, handleChange, handleClearDetailsPanelImage, handleClearPanelImage, handleDeleteService, handleDetailsPanelImageUpload, handleEditService, handleMainImageUpload, handleNewService, handlePanelImageUpload, handleSubmit, handleWashServiceDragEnd, handleWashServiceDragOver, handleWashServiceDragStart, handleWashServiceDrop, loading, loadingAddOns, loadingAllServices, loadingCoverage, message, resolveUploadOrAbsoluteUrl, selectedCoverage, serviceFilter, serviceSearch, servicesError, setServiceFilter, setServiceSearch, toggleCoverage, uploadingDetailsPanelImage, uploadingMainImage, uploadingPanelImage, washReorderEnabled } = useAdminPanelContext()

  return (
      <>
        {/* Services List Section */}
        <div className="services-section">
          <div className="services-header">
            <div>
              <h2 className="services-title">Services</h2>
              <p className="services-subtitle">Manage customer app wash services</p>
            </div>
            <div className="services-total-count">{allServices.length} total</div>
          </div>


          {/* Search and Filters */}
          <div className="services-toolbar">
            <div className="search-box">
              <span className="search-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.5 16.5 21 21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search services by name or description..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="search-input"
              />
              {serviceSearch && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setServiceSearch('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <div className="services-filter-tabs">
              <button
                type="button"
                className={`services-filter-tab ${serviceFilter === 'car' ? 'active' : ''}`}
                onClick={() => setServiceFilter('car')}
              >
                Car Wash ({categoryCounts.car})
              </button>
              <button
                type="button"
                className={`services-filter-tab ${serviceFilter === 'bike' ? 'active' : ''}`}
                onClick={() => setServiceFilter('bike')}
              >
                Bike Wash ({categoryCounts.bike})
              </button>
              <button
                type="button"
                className={`services-filter-tab ${serviceFilter === 'auto' ? 'active' : ''}`}
                onClick={() => setServiceFilter('auto')}
              >
                Auto Wash ({categoryCounts.auto})
              </button>
              <button
                type="button"
                className={`services-filter-tab ${serviceFilter === 'membership' ? 'active' : ''}`}
                onClick={() => setServiceFilter('membership')}
              >
                Woosh Green ({categoryCounts.membership})
              </button>
            </div>
            {washReorderEnabled ? (
              <p className="services-reorder-hint">
                Drag <span className="services-reorder-grip">⋮⋮</span> on a card to change order in the customer app (same category tab).
              </p>
            ) : null}
          </div>


          {servicesError ? (
            <div className="message error">
              {servicesError}
              <button type="button" className="secondary-button" style={{ marginTop: '10px' }} onClick={fetchAllServices}>
                Retry
              </button>
            </div>
          ) : loadingAllServices ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No services found</h3>
              <p>{serviceSearch ? `No services match "${serviceSearch}"` : 'No services match the selected filter'}</p>
              {serviceSearch && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setServiceSearch('')}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="services-mini-grid">
                {filteredServices.map(service => (
                  <div
                    key={service._id}
                    className={`service-mini-card${draggingServiceId === service._id ? ' service-mini-card--dragging' : ''}`}
                    onDragOver={washReorderEnabled ? handleWashServiceDragOver : undefined}
                    onDrop={washReorderEnabled ? (e) => handleWashServiceDrop(e, service) : undefined}
                  >
                    <div className="service-mini-row">
                      {washReorderEnabled ? (
                        <span
                          className="service-drag-handle"
                          draggable
                          onDragStart={(e) => handleWashServiceDragStart(e, service._id)}
                          onDragEnd={handleWashServiceDragEnd}
                          title="Drag to reorder"
                          aria-label="Drag to reorder"
                          role="button"
                          tabIndex={0}
                        >
                          ⋮⋮
                        </span>
                      ) : null}
                      <div className="service-mini-card-main">
                    <div className="service-mini-top">
                      <h3 className="service-mini-name" title={service.name}>{service.name}</h3>
                      <div className="service-mini-price">
                        ₹{service.basePrice}
                        {service.category === 'Membership' && service.listPrice ? (
                          <span className="service-mini-mrp"> · MRP ₹{service.listPrice}</span>
                        ) : null}
                      </div>
                    </div>
                    {service.description ? (
                      <p className="service-mini-desc" title={service.description}>
                        {service.description}
                      </p>
                    ) : null}
                    <div className="service-mini-meta">
                      <span className="service-mini-category">{service.category}</span>
                    </div>
                    <div className="service-mini-actions">
                      <button
                        type="button"
                        className="service-icon-btn service-icon-btn--edit"
                        onClick={() => handleEditService(service._id)}
                        aria-label="Edit service"
                        title="Edit service"
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
                        className="service-icon-btn service-icon-btn--delete"
                        onClick={() => handleDeleteService(service)}
                        aria-label="Delete service"
                        title="Delete service"
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
                  </div>
                ))}
              </div>
            </>
          )}
        </div>


        {/* Create/Edit Service Form */}
        <div className="form-section form-section-flat service-form-section">
          <div className="section-header service-form-header">
            <div>
              <h2 className="section-title service-form-title">
                {editingServiceId ? '✏️ Edit Service' : 'Create New Service'}
              </h2>
              {editingServiceId && (
                <p className="service-form-editing-note">
                  Editing: {formData.name || 'Service'}
                </p>
              )}
            </div>
            {editingServiceId && (
              <button
                type="button"
                className="secondary-button"
                onClick={handleNewService}
              >
                + Create New
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="name">Service Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Basic Routine Cleaning"
            />
          </div>


          <div className="form-group">
            <label htmlFor="description">
              Description
              {(formData.category === 'CarWash' ||
                formData.category === 'BikeWash' ||
                formData.category === 'AutoWash') ? (
                <span> *</span>
              ) : null}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required={
                formData.category === 'CarWash' ||
                formData.category === 'BikeWash' ||
                formData.category === 'AutoWash'
              }
              rows="3"
              placeholder="Enter service description"
            />
          </div>


          <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="CarWash">Car Wash</option>
            <option value="BikeWash">Bike Wash</option>
            <option value="AutoWash">Auto Wash</option>
            <option value="Membership">Woosh Green (Membership)</option>
            <option value="AddOn">Add-On</option>
          </select>
        </div>


        <div className="form-group">
          <label htmlFor="basePrice">
            {formData.category === 'Membership' ? 'Member price (₹) *' : 'Base Price (₹) *'}
          </label>
          <input
            type="number"
            id="basePrice"
            name="basePrice"
            value={formData.basePrice}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="299"
          />
        </div>


        <div className="form-group">
          <label htmlFor="duration">
            Duration
            {(formData.category === 'CarWash' ||
              formData.category === 'BikeWash' ||
              formData.category === 'AutoWash') ? (
              <span> *</span>
            ) : null}
          </label>
          <input
            type="text"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            required={
              formData.category === 'CarWash' ||
              formData.category === 'BikeWash' ||
              formData.category === 'AutoWash'
            }
            placeholder="30 mins"
          />
        </div>
      </div>


          {formData.category === 'Membership' && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="listPrice">List / MRP (₹) *</label>
                <input
                  type="number"
                  id="listPrice"
                  name="listPrice"
                  value={formData.listPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="999"
                />
              </div>
              <div className="form-group">
                <label htmlFor="membershipDurationMonths">Duration (months) *</label>
                <input
                  type="number"
                  id="membershipDurationMonths"
                  name="membershipDurationMonths"
                  value={formData.membershipDurationMonths}
                  onChange={handleChange}
                  required
                  min="1"
                  step="1"
                  placeholder="12"
                />
              </div>
              <div className="form-group">
                <label htmlFor="membershipDiscountPercent">Wash discount (%) *</label>
                <input
                  type="number"
                  id="membershipDiscountPercent"
                  name="membershipDiscountPercent"
                  value={formData.membershipDiscountPercent}
                  onChange={handleChange}
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="40"
                />
              </div>
            </div>
          )}


          <div className="form-group">
            <label>Main Image</label>
            <small className="help-text" style={{ display: 'block', marginBottom: 8 }}>
              Collapsed card photo on Car / Bike / Auto wash screens.
            </small>
            <div className="service-upload-row">
              <label className="service-upload-button">
                <input type="file" accept="image/*" onChange={handleMainImageUpload} disabled={uploadingMainImage} />
                {uploadingMainImage ? 'Uploading...' : 'Upload Main Image'}
              </label>
              {formData.image ? <span className="service-upload-status">Uploaded</span> : <span className="service-upload-status muted">No image</span>}
            </div>
            {formData.image ? (
              <div className="package-image-preview-wrap">
                <img src={resolveUploadOrAbsoluteUrl(formData.image)} alt="" className="package-image-preview" />
                <small className="help-text">{formData.image}</small>
              </div>
            ) : null}
          </div>


          {(formData.category === 'CarWash' || formData.category === 'BikeWash' || formData.category === 'AutoWash') && (
            <div className="form-group">
              <label>Panel Image (expanded card)</label>
              <small className="help-text" style={{ display: 'block', marginBottom: 8 }}>
                Tall image beside Add Services when the customer expands the service card.
              </small>
              <div className="service-upload-row">
                <label className="service-upload-button">
                  <input type="file" accept="image/*" onChange={handlePanelImageUpload} disabled={uploadingPanelImage} />
                  {uploadingPanelImage ? 'Uploading...' : 'Upload Panel Image'}
                </label>
                {formData.panelImage ? (
                  <span className="service-upload-status">Uploaded</span>
                ) : (
                  <span className="service-upload-status muted">No image</span>
                )}
              </div>
              {formData.panelImage ? (
                <>
                  <div className="package-image-preview-wrap">
                    <img src={resolveUploadOrAbsoluteUrl(formData.panelImage)} alt="" className="package-image-preview" />
                    <small className="help-text">{formData.panelImage}</small>
                  </div>
                  <button type="button" className="secondary-button" onClick={handleClearPanelImage} style={{ marginTop: 8 }}>
                    Clear panel image
                  </button>
                </>
              ) : null}
            </div>
          )}


          {(formData.category === 'CarWash' || formData.category === 'BikeWash' || formData.category === 'AutoWash') && (
            <div className="form-group">
              <label>Panel Image (View Details)</label>
              <small className="help-text" style={{ display: 'block', marginBottom: 8 }}>
                Tall image beside Add Services when the customer taps View Details (bottom sheet).
              </small>
              <div className="service-upload-row">
                <label className="service-upload-button">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDetailsPanelImageUpload}
                    disabled={uploadingDetailsPanelImage}
                  />
                  {uploadingDetailsPanelImage ? 'Uploading...' : 'Upload Panel Image'}
                </label>
                {formData.detailsPanelImage ? (
                  <span className="service-upload-status">Uploaded</span>
                ) : (
                  <span className="service-upload-status muted">No image</span>
                )}
              </div>
              {formData.detailsPanelImage ? (
                <>
                  <div className="package-image-preview-wrap">
                    <img
                      src={resolveUploadOrAbsoluteUrl(formData.detailsPanelImage)}
                      alt=""
                      className="package-image-preview package-panel-preview"
                    />
                    <small className="help-text">{formData.detailsPanelImage}</small>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleClearDetailsPanelImage}
                    style={{ marginTop: 8 }}
                  >
                    Clear View Details panel image
                  </button>
                </>
              ) : (
                <small className="help-text">
                  If empty, the app uses the expanded-card panel image. Recommended: tall portrait (~600×900 px).
                </small>
              )}
            </div>
          )}


          {(formData.category === 'CarWash' || formData.category === 'BikeWash' || formData.category === 'AutoWash') && (
            <div className="form-group service-coverage-group">
              <label>Coverage (Included)</label>
          {loadingCoverage ? (
            <div className="loading-text">Loading coverage...</div>
          ) : availableCoverage.length === 0 ? (
            <div className="info-text">No coverage items available. Create coverage items first.</div>
          ) : (
            <div className="coverage-container">
              {availableCoverage.map(item => (
                <label key={item._id} className="coverage-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedCoverage.includes(item.name)}
                    onChange={() => toggleCoverage(item.name)}
                  />
                  <span>{item.name}</span>
                </label>
              ))}
            </div>
          )}
              <small className="help-text">Selected items go to Included. Others go to Not Included automatically.</small>
            </div>
          )}


          {(formData.category === 'CarWash' || formData.category === 'BikeWash' || formData.category === 'AutoWash') && (
            <div className="form-group service-not-included-group">
              <label>Not Included (auto)</label>
          {availableCoverage.length === 0 ? (
            <div className="info-text">No coverage items available.</div>
          ) : (
            <div className="not-included-list">
              {availableCoverage
                .map(item => item.name)
                .filter(name => !selectedCoverage.includes(name))
                .map(name => (
                  <span key={name} className="not-included-item">{name}</span>
                ))}
            </div>
              )}
            </div>
          )}


          {/* Add-Ons are auto-attached based on service category */}
          {(formData.category === 'CarWash' || formData.category === 'BikeWash' || formData.category === 'AutoWash') && (
            <div className="form-group auto-addons-section">
              <label>Auto Add-Ons</label>
          {loadingAddOns ? (
            <div className="loading-text">Loading add-ons...</div>
          ) : availableAddOns.length === 0 ? (
            <div className="info-text">No add-ons available. Create add-ons first with category "Add-On".</div>
          ) : (
            <div className="addons-container">
              {availableAddOns.map(addOn => (
                <div key={addOn._id} className="addon-info">
                  <span className="addon-name">{addOn.name}</span>
                  <span className="addon-price">₹{addOn.basePrice}</span>
                </div>
              ))}
            </div>
          )}
              <small className="help-text">All applicable add-ons are attached automatically.</small>
            </div>
          )}


          {/*
          Pricing Packages UI temporarily disabled:
          {(formData.category === 'CarWash' || formData.category === 'BikeWash') && (
            <>
              {renderPackageSection('Monthly Packages', 'monthly')}
              {renderPackageSection('Quarterly Packages', 'quarterly')}
              {renderPackageSection('Yearly Packages', 'yearly')}
            </>
          )}
          */}


          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}


            <div className="form-actions">
              <button
                type="submit"
                className={`submit-button ${editingServiceId ? '' : 'submit-button-create'}`.trim()}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    {editingServiceId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {editingServiceId ? 'Update Service' : 'Create Service'}
                  </>
                )}
              </button>
              {editingServiceId && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleNewService}
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </>
  )
}
