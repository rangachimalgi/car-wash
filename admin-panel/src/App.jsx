import React, { useState, useEffect } from 'react'
import './App.css'

// API configuration
const API_BASE_URL = 'http://localhost:8000/api'

function App() {
  const [activeTab, setActiveTab] = useState('services') // 'services', 'addons', 'coverage', 'orders'
  
  // Services form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'CarWash',
    basePrice: '',
    duration: '30 mins',
    image: '',
    images: '',
    rating: '0',
    totalReviews: '0',
    isActive: true,
    packages: {
      monthly: [],
      quarterly: [],
      yearly: [],
    },
  })

  // Add-On form data
  const [addOnFormData, setAddOnFormData] = useState({
    name: '',
    basePrice: '',
    isActive: true,
    applicableFor: [], // Array for CarWash, BikeWash, or both
  })

  // Coverage form data
  const [coverageFormData, setCoverageFormData] = useState({
    name: '',
    isActive: true,
    applicableFor: [], // Array for CarWash, BikeWash, or both
  })

  const [availableAddOns, setAvailableAddOns] = useState([])
  const [allAddOns, setAllAddOns] = useState([]) // All add-ons for listing
  const [addOnFilter, setAddOnFilter] = useState('all') // 'all', 'car', 'bike'
  const [availableCoverage, setAvailableCoverage] = useState([])
  const [allCoverage, setAllCoverage] = useState([]) // All coverage items for listing
  const [coverageFilter, setCoverageFilter] = useState('all') // 'all', 'car', 'bike'
  const [selectedCoverage, setSelectedCoverage] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingAddOn, setLoadingAddOn] = useState(false)
  const [loadingAddOns, setLoadingAddOns] = useState(false)
  const [loadingAllAddOns, setLoadingAllAddOns] = useState(false)
  const [loadingCoverage, setLoadingCoverage] = useState(false)
  const [loadingAllCoverage, setLoadingAllCoverage] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [addOnMessage, setAddOnMessage] = useState({ type: '', text: '' })
  const [coverageMessage, setCoverageMessage] = useState({ type: '', text: '' })
  const [orders, setOrders] = useState([])

  // Fetch available add-ons when component mounts
  useEffect(() => {
    fetchAddOns()
    fetchAllAddOns()
    fetchCoverage()
    fetchAllCoverage()
    fetchOrders()
  }, [])

  // Fetch all add-ons for listing
  const fetchAllAddOns = async () => {
    setLoadingAllAddOns(true)
    try {
      const response = await fetch(`${API_BASE_URL}/services?category=AddOn`)
      const data = await response.json()
      if (data.success) {
        setAllAddOns(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching all add-ons:', error)
    } finally {
      setLoadingAllAddOns(false)
    }
  }

  // Fetch all coverage items for listing
  const fetchAllCoverage = async () => {
    setLoadingAllCoverage(true)
    try {
      const response = await fetch(`${API_BASE_URL}/services?category=Coverage`)
      const data = await response.json()
      if (data.success) {
        setAllCoverage(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching coverage items:', error)
    } finally {
      setLoadingAllCoverage(false)
    }
  }

  // Filter add-ons based on selected filter
  const filteredAddOns = allAddOns.filter(addOn => {
    if (addOnFilter === 'all') return true
    if (addOnFilter === 'car') {
      // Show add-ons that have CarWash in applicableFor, or if applicableFor is empty/missing (legacy)
      return (addOn.applicableFor && addOn.applicableFor.includes('CarWash')) ||
             (!addOn.applicableFor || addOn.applicableFor.length === 0)
    }
    if (addOnFilter === 'bike') {
      // Show add-ons that have BikeWash in applicableFor, or if applicableFor is empty/missing (legacy)
      return (addOn.applicableFor && addOn.applicableFor.includes('BikeWash')) ||
             (!addOn.applicableFor || addOn.applicableFor.length === 0)
    }
    return true
  })

  // Filter coverage based on selected filter
  const filteredCoverage = allCoverage.filter(item => {
    if (coverageFilter === 'all') return true
    if (coverageFilter === 'car') {
      return Array.isArray(item.applicableFor) && item.applicableFor.includes('CarWash')
    }
    if (coverageFilter === 'bike') {
      return Array.isArray(item.applicableFor) && item.applicableFor.includes('BikeWash')
    }
    return true
  })

  useEffect(() => {
    // Refetch add-ons filtered by category
    fetchAddOns()
    setSelectedCoverage([])
    fetchCoverage()
  }, [formData.category])

  // Refresh add-ons list when add-on is created
  useEffect(() => {
    if (activeTab === 'addons') {
      fetchAllAddOns()
    }
  }, [addOnMessage.text, activeTab])

  useEffect(() => {
    if (activeTab === 'coverage') {
      fetchAllCoverage()
    }
  }, [coverageMessage.text, activeTab])

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders()
    }
  }, [activeTab])

  const fetchAddOns = async () => {
    setLoadingAddOns(true)
    try {
      const response = await fetch(`${API_BASE_URL}/services?category=AddOn`)
      const data = await response.json()
      if (data.success) {
        let addOns = data.data || []
        
        // Filter add-ons based on selected service category (only if creating a service)
        if (activeTab === 'services' && formData.category) {
          addOns = addOns.filter(addOn => {
            // Show add-on if it's applicable for the selected category
            // Also show add-ons without applicableFor (legacy data) - they'll appear for both
            if (!addOn.applicableFor || addOn.applicableFor.length === 0) {
              return true // Show legacy add-ons for all categories
            }
            return addOn.applicableFor.includes(formData.category)
          })
        }
        
        setAvailableAddOns(addOns)
      }
    } catch (error) {
      console.error('Error fetching add-ons:', error)
    } finally {
      setLoadingAddOns(false)
    }
  }

  const fetchCoverage = async () => {
    setLoadingCoverage(true)
    try {
      const response = await fetch(`${API_BASE_URL}/services?category=Coverage`)
      const data = await response.json()
      if (data.success) {
        let items = data.data || []
        if (activeTab === 'services' && formData.category) {
          items = items.filter(item =>
            Array.isArray(item.applicableFor) && item.applicableFor.includes(formData.category)
          )
        }
        setAvailableCoverage(items)
      }
    } catch (error) {
      console.error('Error fetching coverage items:', error)
    } finally {
      setLoadingCoverage(false)
    }
  }

  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      const response = await fetch(`${API_BASE_URL}/orders`)
      const data = await response.json()
      if (data.success) {
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const markOrderDelivered = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Completed' }),
      })
      const data = await response.json()
      if (data.success) {
        setOrders(prev => prev.map(order => (
          order._id === orderId ? data.data : order
        )))
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const handleAddOnChange = (e) => {
    const { name, value, type, checked } = e.target
    
    // Handle applicableFor checkboxes separately
    if (name === 'applicableFor') {
      setAddOnFormData(prev => {
        const current = prev.applicableFor || []
        if (checked) {
          return { ...prev, applicableFor: [...current, value] }
        } else {
          return { ...prev, applicableFor: current.filter(cat => cat !== value) }
        }
      })
    } else {
      setAddOnFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleCoverageChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'applicableFor') {
      setCoverageFormData(prev => {
        const current = prev.applicableFor || []
        if (checked) {
          return { ...prev, applicableFor: [...current, value] }
        } else {
          return { ...prev, applicableFor: current.filter(cat => cat !== value) }
        }
      })
    } else {
      setCoverageFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const toggleCoverage = (coverageName) => {
    setSelectedCoverage(prev => {
      if (prev.includes(coverageName)) {
        return prev.filter(name => name !== coverageName)
      }
      return [...prev, coverageName]
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const addPackageRow = (packageType) => {
    setFormData(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [packageType]: [
          ...(prev.packages?.[packageType] || []),
          { times: '', price: '' }
        ],
      },
    }))
  }

  const updatePackageRow = (packageType, index, field, value) => {
    setFormData(prev => {
      const rows = [...(prev.packages?.[packageType] || [])]
      rows[index] = { ...rows[index], [field]: value }
      return {
        ...prev,
        packages: {
          ...prev.packages,
          [packageType]: rows,
        },
      }
    })
  }

  const removePackageRow = (packageType, index) => {
    setFormData(prev => {
      const rows = [...(prev.packages?.[packageType] || [])]
      rows.splice(index, 1)
      return {
        ...prev,
        packages: {
          ...prev.packages,
          [packageType]: rows,
        },
      }
    })
  }

  const calculatePackageValues = (timesValue, priceValue) => {
    const times = parseInt(timesValue)
    const price = parseFloat(priceValue)
    if (!times || Number.isNaN(price)) {
      return { perWash: '', discount: '' }
    }

    const perWash = price / times
    const basePrice = parseFloat(formData.basePrice)
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      return { perWash, discount: '' }
    }

    const originalTotal = basePrice * times
    const discount = Math.max(0, ((originalTotal - price) / originalTotal) * 100)
    return { perWash, discount }
  }

  const renderPackageSection = (title, packageType) => {
    const rows = formData.packages?.[packageType] || []
    return (
      <div className="form-group">
        <div className="section-header">
          <h3 className="section-title">{title}</h3>
          <button
            type="button"
            className="secondary-button"
            onClick={() => addPackageRow(packageType)}
          >
            Add Row
          </button>
        </div>
        {rows.length === 0 ? (
          <div className="info-text">No packages added yet.</div>
        ) : (
          <div className="packages-grid">
            {rows.map((row, index) => (
              <div key={`${packageType}-${index}`} className="package-row">
                <input
                  type="number"
                  min="1"
                  placeholder="Times"
                  value={row.times}
                  onChange={(e) => updatePackageRow(packageType, index, 'times', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Total Price"
                  value={row.price}
                  onChange={(e) => updatePackageRow(packageType, index, 'price', e.target.value)}
                />
                {(() => {
                  const { perWash, discount } = calculatePackageValues(row.times, row.price)
                  const perWashDisplay = perWash === '' ? '' : perWash.toFixed(2)
                  const discountDisplay = discount === '' ? '' : discount.toFixed(1)
                  return (
                    <>
                      <input
                        type="text"
                        placeholder="Discount %"
                        value={discountDisplay}
                        readOnly
                        disabled
                      />
                      <input
                        type="text"
                        placeholder="Per Wash"
                        value={perWashDisplay}
                        readOnly
                        disabled
                      />
                    </>
                  )
                })()}
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => removePackageRow(packageType, index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <small className="help-text">Times = washes per period. Price = total for the package.</small>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Parse arrays from comma-separated strings
      const images = formData.images 
        ? formData.images.split(',').map(img => img.trim()).filter(img => img)
        : []

      const coverage = (formData.category === 'CarWash' || formData.category === 'BikeWash')
        ? selectedCoverage
        : []

      const notIncluded = (formData.category === 'CarWash' || formData.category === 'BikeWash')
        ? availableCoverage
            .map(item => item.name)
            .filter(name => !selectedCoverage.includes(name))
        : []

      const applicableAddOnIds = (formData.category === 'CarWash' || formData.category === 'BikeWash')
        ? availableAddOns.map(addOn => addOn._id)
        : []

      const formatPackages = (pkg) => {
        const normalizeRow = (row) => {
          const times = parseInt(row.times)
          const price = parseFloat(row.price)
          const { perWash, discount } = calculatePackageValues(row.times, row.price)

          return {
            times,
            discount: discount === '' ? 0 : Number(discount.toFixed(2)),
            price,
            perWash: perWash === '' ? 0 : Number(perWash.toFixed(2)),
          }
        }

        return {
          monthly: (pkg?.monthly || []).filter(row => row.times && row.price).map(normalizeRow),
          quarterly: (pkg?.quarterly || []).filter(row => row.times && row.price).map(normalizeRow),
          yearly: (pkg?.yearly || []).filter(row => row.times && row.price).map(normalizeRow),
        }
      }

      const serviceData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        basePrice: parseFloat(formData.basePrice),
        duration: formData.duration,
        image: formData.image,
        images: images,
        rating: parseFloat(formData.rating) || 0,
        totalReviews: parseInt(formData.totalReviews) || 0,
        isActive: formData.isActive,
        specifications: {
          coverage: coverage,
          notIncluded: notIncluded,
        },
        addOnServices: applicableAddOnIds, // Auto-attach all applicable add-ons
        packages: formatPackages(formData.packages),
      }

      const response = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Service created successfully!' })
        // Reset form
          setFormData({
            name: '',
            description: '',
            category: 'CarWash',
            basePrice: '',
            duration: '30 mins',
            image: '',
            images: '',
            rating: '0',
            totalReviews: '0',
            isActive: true,
            packages: {
              monthly: [],
              quarterly: [],
              yearly: [],
            },
          })
          setSelectedCoverage([])
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Failed to create service' 
        })
      }
    } catch (error) {
      console.error('Error creating service:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Network error. Please check if backend is running.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddOnSubmit = async (e) => {
    e.preventDefault()
    setLoadingAddOn(true)
    setAddOnMessage({ type: '', text: '' })

    // Validate applicableFor
    if (!addOnFormData.applicableFor || addOnFormData.applicableFor.length === 0) {
      setAddOnMessage({ 
        type: 'error', 
        text: 'Please select at least one service type (Car Wash or Bike Wash)' 
      })
      setLoadingAddOn(false)
      return
    }

    try {
      const addOnData = {
        name: addOnFormData.name,
        category: 'AddOn', // Always AddOn for add-ons
        basePrice: parseFloat(addOnFormData.basePrice),
        isActive: addOnFormData.isActive,
        applicableFor: addOnFormData.applicableFor || [], // CarWash, BikeWash, or both
        addOnServices: [],
        packages: {
          monthly: [],
          quarterly: [],
          yearly: [],
        },
      }

      const response = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addOnData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setAddOnMessage({ type: 'success', text: 'Add-On created successfully!' })
        // Reset form
        setAddOnFormData({
          name: '',
          basePrice: '',
          isActive: true,
          applicableFor: [],
        })
        // Refresh add-ons list
        fetchAddOns()
      } else {
        setAddOnMessage({ 
          type: 'error', 
          text: data.message || 'Failed to create add-on' 
        })
      }
    } catch (error) {
      console.error('Error creating add-on:', error)
      setAddOnMessage({ 
        type: 'error', 
        text: error.message || 'Network error. Please check if backend is running.' 
      })
    } finally {
      setLoadingAddOn(false)
    }
  }

  const handleCoverageSubmit = async (e) => {
    e.preventDefault()
    setLoadingCoverage(true)
    setCoverageMessage({ type: '', text: '' })

    if (!coverageFormData.applicableFor || coverageFormData.applicableFor.length === 0) {
      setCoverageMessage({
        type: 'error',
        text: 'Please select at least one service type (Car Wash or Bike Wash)'
      })
      setLoadingCoverage(false)
      return
    }

    try {
      const coverageData = {
        name: coverageFormData.name,
        category: 'Coverage',
        basePrice: 0,
        isActive: coverageFormData.isActive,
        applicableFor: coverageFormData.applicableFor || [],
        addOnServices: [],
        packages: {
          monthly: [],
          quarterly: [],
          yearly: [],
        },
      }

      const response = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coverageData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCoverageMessage({ type: 'success', text: 'Coverage item created successfully!' })
        setCoverageFormData({
          name: '',
          isActive: true,
          applicableFor: [],
        })
        fetchCoverage()
      } else {
        setCoverageMessage({
          type: 'error',
          text: data.message || 'Failed to create coverage item'
        })
      }
    } catch (error) {
      console.error('Error creating coverage item:', error)
      setCoverageMessage({
        type: 'error',
        text: error.message || 'Network error. Please check if backend is running.'
      })
    } finally {
      setLoadingCoverage(false)
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">Admin Panel</h1>
        <p className="subtitle">Woosh Car & Bike Wash Service</p>

        {/* Tabs */}
        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            Services
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'addons' ? 'active' : ''}`}
            onClick={() => setActiveTab('addons')}
          >
            Add-Ons
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'coverage' ? 'active' : ''}`}
            onClick={() => setActiveTab('coverage')}
          >
            Coverage
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
        </div>

        {/* Services Form */}
        {activeTab === 'services' && (
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
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
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
                <option value="AddOn">Add-On</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="basePrice">Base Price (₹) *</label>
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
              <label htmlFor="duration">Duration *</label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                placeholder="30 mins"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="image">Main Image URL</label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="form-group">
            <label htmlFor="images">Additional Images (comma-separated URLs)</label>
            <input
              type="text"
              id="images"
              name="images"
              value={formData.images}
              onChange={handleChange}
              placeholder="https://img1.com, https://img2.com"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rating">Rating (0-5)</label>
              <input
                type="number"
                id="rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                min="0"
                max="5"
                step="0.1"
                placeholder="4.5"
              />
            </div>

            <div className="form-group">
              <label htmlFor="totalReviews">Total Reviews</label>
              <input
                type="number"
                id="totalReviews"
                name="totalReviews"
                value={formData.totalReviews}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                Active Service
              </label>
            </div>
          </div>

          {(formData.category === 'CarWash' || formData.category === 'BikeWash') && (
            <div className="form-group">
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

          {(formData.category === 'CarWash' || formData.category === 'BikeWash') && (
            <div className="form-group">
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
          {(formData.category === 'CarWash' || formData.category === 'BikeWash') && (
            <div className="form-group">
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

          {/* Pricing Packages */}
          {(formData.category === 'CarWash' || formData.category === 'BikeWash') && (
            <>
              {renderPackageSection('Monthly Packages', 'monthly')}
              {renderPackageSection('Quarterly Packages', 'quarterly')}
              {renderPackageSection('Yearly Packages', 'yearly')}
            </>
          )}

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating...' : 'Create Service'}
          </button>
        </form>
        )}

        {/* Add-Ons Form */}
        {activeTab === 'addons' && (
          <>
            {/* Add-Ons List Section */}
            <div className="addons-list-section">
              <div className="section-header">
                <h2 className="section-title">Existing Add-Ons</h2>
                <div className="filter-tabs">
                  <button
                    type="button"
                    className={`filter-tab ${addOnFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setAddOnFilter('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${addOnFilter === 'car' ? 'active' : ''}`}
                    onClick={() => setAddOnFilter('car')}
                  >
                    Car Wash
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${addOnFilter === 'bike' ? 'active' : ''}`}
                    onClick={() => setAddOnFilter('bike')}
                  >
                    Bike Wash
                  </button>
                </div>
              </div>

              {loadingAllAddOns ? (
                <div className="loading-text">Loading add-ons...</div>
              ) : filteredAddOns.length === 0 ? (
                <div className="info-text">No add-ons found for this filter.</div>
              ) : (
                <div className="addons-grid">
                  {filteredAddOns.map(addOn => (
                    <div key={addOn._id} className="addon-card">
                      <div className="addon-card-header">
                        <h3 className="addon-card-title">{addOn.name}</h3>
                        <span className={`addon-status ${addOn.isActive ? 'active' : 'inactive'}`}>
                          {addOn.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="addon-card-details">
                        <div className="detail-item">
                          <span className="detail-label">Price:</span>
                          <span className="detail-value">₹{addOn.basePrice}</span>
                        </div>
                      </div>
                      <div className="addon-card-footer">
                        <span className="applicable-for">
                          For: {addOn.applicableFor && addOn.applicableFor.length > 0 
                            ? addOn.applicableFor.map(cat => cat === 'CarWash' ? 'Car Wash' : 'Bike Wash').join(', ')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Add-On Form */}
            <div className="form-section-divider"></div>
            <h2 className="section-title">Create New Add-On</h2>
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
              </div>
              <small className="help-text">Select which service types can use this add-on</small>
            </div>

            {addOnMessage.text && (
              <div className={`message ${addOnMessage.type}`}>
                {addOnMessage.text}
              </div>
            )}

            <button type="submit" className="submit-button" disabled={loadingAddOn}>
              {loadingAddOn ? 'Creating...' : 'Create Add-On'}
            </button>
          </form>
          </>
        )}

        {/* Coverage Form */}
        {activeTab === 'coverage' && (
          <>
            {/* Coverage List Section */}
            <div className="addons-list-section">
              <div className="section-header">
                <h2 className="section-title">Coverage Items</h2>
                <div className="filter-tabs">
                  <button
                    type="button"
                    className={`filter-tab ${coverageFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setCoverageFilter('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${coverageFilter === 'car' ? 'active' : ''}`}
                    onClick={() => setCoverageFilter('car')}
                  >
                    Car Wash
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${coverageFilter === 'bike' ? 'active' : ''}`}
                    onClick={() => setCoverageFilter('bike')}
                  >
                    Bike Wash
                  </button>
                </div>
              </div>

              {loadingAllCoverage ? (
                <div className="loading-text">Loading coverage items...</div>
              ) : filteredCoverage.length === 0 ? (
                <div className="info-text">No coverage items found for this filter.</div>
              ) : (
                <div className="addons-grid">
                  {filteredCoverage.map(item => (
                    <div key={item._id} className="addon-card">
                      <div className="addon-card-header">
                        <h3 className="addon-card-title">{item.name}</h3>
                        <span className={`addon-status ${item.isActive ? 'active' : 'inactive'}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="addon-card-footer">
                        <span className="applicable-for">
                          For: {item.applicableFor && item.applicableFor.length > 0
                            ? item.applicableFor.map(cat => cat === 'CarWash' ? 'Car Wash' : 'Bike Wash').join(', ')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Coverage Form */}
            <div className="form-section-divider"></div>
            <h2 className="section-title">Create Coverage Item</h2>
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
                </div>
                <small className="help-text">Select which service types use this coverage</small>
              </div>

              {coverageMessage.text && (
                <div className={`message ${coverageMessage.type}`}>
                  {coverageMessage.text}
                </div>
              )}

              <button type="submit" className="submit-button" disabled={loadingCoverage}>
                {loadingCoverage ? 'Creating...' : 'Create Coverage'}
              </button>
            </form>
          </>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="section-header">
              <h2 className="section-title">Orders</h2>
              <button
                type="button"
                className="secondary-button"
                onClick={fetchOrders}
              >
                Refresh
              </button>
            </div>

            {loadingOrders ? (
              <div className="loading-text">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="info-text">No orders yet.</div>
            ) : (
              <div className="orders-grid">
                {orders.map(order => (
                  <div key={order._id} className="order-card">
                    <div className="order-card-header">
                      <h3 className="order-card-title">Order #{order._id.slice(-6)}</h3>
                      <span className={`order-status ${order.status?.toLowerCase()}`}>
                        {order.status || 'Pending'}
                      </span>
                    </div>
                    <div className="order-card-details">
                      <div className="detail-item">
                        <span className="detail-label">Total:</span>
                        <span className="detail-value">₹{order.totalAmount?.toFixed(2)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Items:</span>
                        <span className="detail-value">{order.items?.length || 0}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="order-card-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={order.status === 'Completed'}
                        onClick={() => markOrderDelivered(order._id)}
                      >
                        Mark Delivered
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
