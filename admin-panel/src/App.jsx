import React, { useState, useEffect } from 'react'
import './App.css'

// API configuration
// For local development: use your computer's IP address
// Find it with: ipconfig getifaddr en0 (Mac) or ipconfig (Windows)
const COMPUTER_IP = '192.168.1.3'
const API_BASE_URL = `http://${COMPUTER_IP}:8000/api`
// For production, uncomment the line below and comment the line above:
// const API_BASE_URL = 'https://car-wash-vbry.onrender.com/api'

function App() {
  const [activeTab, setActiveTab] = useState('services') // 'services', 'addons', 'coverage', 'orders', 'attendance', 'inventory'
  
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
  const [loadingAllServices, setLoadingAllServices] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [addOnMessage, setAddOnMessage] = useState({ type: '', text: '' })
  const [coverageMessage, setCoverageMessage] = useState({ type: '', text: '' })
  const [orders, setOrders] = useState([])
  const [allServices, setAllServices] = useState([])
  const [serviceFilter, setServiceFilter] = useState('all') // 'all', 'car', 'bike'
  const [editingServiceId, setEditingServiceId] = useState(null) // Track which service is being edited
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('adminAuthToken') || '')
  
  // Attendance state
  const [attendance, setAttendance] = useState([])
  const [employees, setEmployees] = useState([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all')

  // Inventory state
  const [inventory, setInventory] = useState([])
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [inventoryFilter, setInventoryFilter] = useState('all') // 'all', 'lowStock', or category
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all')
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventoryFormData, setInventoryFormData] = useState({
    name: '',
    category: 'Soap',
    currentStock: '',
    unit: 'units',
    lowStockThreshold: '',
    description: '',
    supplier: '',
  })
  const [editingInventoryId, setEditingInventoryId] = useState(null)
  const [inventoryMessage, setInventoryMessage] = useState({ type: '', text: '' })
  const [stockUpdateModal, setStockUpdateModal] = useState({ open: false, item: null, quantity: '', operation: 'add' })

  // Helper function to create fetch options with auth headers
  const getFetchOptions = (options = {}) => {
    return {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...(options.headers || {}),
      },
    }
  }

  // Fetch available add-ons when component mounts
  useEffect(() => {
    fetchAddOns()
    fetchAllAddOns()
    fetchCoverage()
    fetchAllCoverage()
    fetchOrders()
    fetchAllServices()
    fetchEmployees()
  }, [])

  // Fetch attendance when attendance tab is active or date/employee filter changes
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance()
    }
  }, [activeTab, attendanceDate, selectedEmployeeId])

  // Fetch inventory when inventory tab is active or filters change
  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventory()
    }
  }, [activeTab, inventoryCategoryFilter, inventoryFilter, inventorySearch])

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
    if (activeTab === 'services') {
      fetchAllServices()
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
      // Use admin route that doesn't require authentication
      const response = await fetch(`${API_BASE_URL}/orders/admin/all`)
      const data = await response.json()
      if (data.success) {
        setOrders(data.data || [])
      } else {
        console.error('Error fetching orders:', data.message || 'Unknown error')
        setMessage({ type: 'error', text: data.message || 'Error fetching orders' })
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setMessage({ type: 'error', text: `Network error: ${error.message}. Check if server is running on ${API_BASE_URL}` })
    } finally {
      setLoadingOrders(false)
    }
  }

  // Fetch all employees
  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const response = await fetch(`${API_BASE_URL}/employees`)
      const data = await response.json()
      if (data.success) {
        setEmployees(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoadingEmployees(false)
    }
  }

  // Get employee info by employeeId
  const getEmployeeInfo = (employeeId) => {
    return employees.find(emp => emp.employeeId === employeeId) || null
  }

  // Fetch attendance data
  const fetchAttendance = async () => {
    setLoadingAttendance(true)
    try {
      // Fetch employees first if not already loaded
      if (employees.length === 0) {
        await fetchEmployees()
      }

      let url = `${API_BASE_URL}/attendance/admin/all?date=${attendanceDate}`
      if (selectedEmployeeId !== 'all') {
        url += `&employeeId=${selectedEmployeeId}`
      }
      
      console.log('Fetching attendance from:', url)
      const response = await fetch(url)
      const data = await response.json()
      console.log('Attendance response:', data)
      if (data.success) {
        setAttendance(data.data || [])
      } else {
        console.error('Error fetching attendance:', data.message || 'Unknown error')
        setAttendance([])
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      setAttendance([])
    } finally {
      setLoadingAttendance(false)
    }
  }

  // Calculate attendance summary
  const getAttendanceSummary = () => {
    const totalEmployees = employees.length
    const present = attendance.filter(a => a.checkIn).length
    const absent = totalEmployees - present
    
    return { total: totalEmployees, present, absent }
  }

  // Format time from ISO string
  const formatTime = (isoString) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Fetch inventory items
  const fetchInventory = async () => {
    setLoadingInventory(true)
    try {
      let url = `${API_BASE_URL}/inventory`
      const params = []
      
      if (inventoryCategoryFilter !== 'all') {
        params.push(`category=${inventoryCategoryFilter}`)
      }
      if (inventoryFilter === 'lowStock') {
        params.push('lowStock=true')
      }
      if (inventorySearch) {
        params.push(`search=${encodeURIComponent(inventorySearch)}`)
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&')
      }
      
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setInventory(data.data || [])
      } else {
        console.error('Error fetching inventory:', data.message)
        setInventoryMessage({ type: 'error', text: data.message || 'Error fetching inventory' })
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setInventoryMessage({ type: 'error', text: `Network error: ${error.message}` })
    } finally {
      setLoadingInventory(false)
    }
  }

  // Handle inventory form change
  const handleInventoryChange = (e) => {
    const { name, value } = e.target
    setInventoryFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle inventory form submit
  const handleInventorySubmit = async (e) => {
    e.preventDefault()
    setLoadingInventory(true)
    setInventoryMessage({ type: '', text: '' })

    try {
      const inventoryData = {
        name: inventoryFormData.name.trim(),
        category: inventoryFormData.category,
        currentStock: Number(inventoryFormData.currentStock),
        unit: inventoryFormData.unit.trim(),
        lowStockThreshold: Number(inventoryFormData.lowStockThreshold),
        description: inventoryFormData.description.trim(),
        supplier: inventoryFormData.supplier.trim(),
      }

      const url = editingInventoryId 
        ? `${API_BASE_URL}/inventory/${editingInventoryId}`
        : `${API_BASE_URL}/inventory`
      const method = editingInventoryId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inventoryData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setInventoryMessage({ 
          type: 'success', 
          text: editingInventoryId ? 'Inventory item updated successfully!' : 'Inventory item created successfully!' 
        })
        // Reset form
        setInventoryFormData({
          name: '',
          category: 'Soap',
          currentStock: '',
          unit: 'units',
          lowStockThreshold: '',
          description: '',
          supplier: '',
        })
        setEditingInventoryId(null)
        // Refresh inventory list
        fetchInventory()
      } else {
        setInventoryMessage({ 
          type: 'error', 
          text: data.message || (editingInventoryId ? 'Failed to update item' : 'Failed to create item')
        })
      }
    } catch (error) {
      console.error('Error saving inventory item:', error)
      setInventoryMessage({ 
        type: 'error', 
        text: error.message || 'Network error. Please check if backend is running.' 
      })
    } finally {
      setLoadingInventory(false)
    }
  }

  // Handle edit inventory item
  const handleEditInventory = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const item = data.data
        setEditingInventoryId(itemId)
        setInventoryFormData({
          name: item.name || '',
          category: item.category || 'Soap',
          currentStock: String(item.currentStock || ''),
          unit: item.unit || 'units',
          lowStockThreshold: String(item.lowStockThreshold || ''),
          description: item.description || '',
          supplier: item.supplier || '',
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Error loading inventory item for edit:', error)
      setInventoryMessage({ type: 'error', text: 'Failed to load item data' })
    }
  }

  // Handle new inventory item
  const handleNewInventory = () => {
    setEditingInventoryId(null)
    setInventoryFormData({
      name: '',
      category: 'Soap',
      currentStock: '',
      unit: 'units',
      lowStockThreshold: '',
      description: '',
      supplier: '',
    })
  }

  // Handle stock update
  const handleStockUpdate = async () => {
    if (!stockUpdateModal.item || !stockUpdateModal.quantity || Number(stockUpdateModal.quantity) <= 0) {
      setInventoryMessage({ type: 'error', text: 'Please enter a valid quantity' })
      return
    }

    setLoadingInventory(true)
    setInventoryMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${stockUpdateModal.item._id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: Number(stockUpdateModal.quantity),
          operation: stockUpdateModal.operation,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setInventoryMessage({ type: 'success', text: data.message || 'Stock updated successfully!' })
        setStockUpdateModal({ open: false, item: null, quantity: '', operation: 'add' })
        fetchInventory()
      } else {
        setInventoryMessage({ type: 'error', text: data.message || 'Failed to update stock' })
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      setInventoryMessage({ type: 'error', text: error.message || 'Network error' })
    } finally {
      setLoadingInventory(false)
    }
  }

  // Handle delete inventory item
  const handleDeleteInventory = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) {
      return
    }

    setLoadingInventory(true)
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${itemId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setInventoryMessage({ type: 'success', text: 'Inventory item deleted successfully!' })
        fetchInventory()
      } else {
        setInventoryMessage({ type: 'error', text: data.message || 'Failed to delete item' })
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      setInventoryMessage({ type: 'error', text: error.message || 'Network error' })
    } finally {
      setLoadingInventory(false)
    }
  }

  // Filter inventory items
  const filteredInventory = inventory.filter(item => {
    if (inventoryCategoryFilter !== 'all' && item.category !== inventoryCategoryFilter) {
      return false
    }
    if (inventoryFilter === 'lowStock' && !item.isLowStock) {
      return false
    }
    if (inventorySearch && !item.name.toLowerCase().includes(inventorySearch.toLowerCase())) {
      return false
    }
    return true
  })

  // Get inventory summary
  const getInventorySummary = () => {
    const totalItems = inventory.length
    const lowStockItems = inventory.filter(item => item.isLowStock).length
    const totalStockValue = inventory.reduce((sum, item) => sum + item.currentStock, 0)
    
    return { totalItems, lowStockItems, totalStockValue }
  }

  // Fetch all services for listing
  const fetchAllServices = async () => {
    setLoadingAllServices(true)
    try {
      const response = await fetch(`${API_BASE_URL}/services?isActive=true`)
      const data = await response.json()
      if (data.success) {
        // Filter to only CarWash and BikeWash services
        const services = (data.data || []).filter(s => s.category === 'CarWash' || s.category === 'BikeWash')
        setAllServices(services)
      }
    } catch (error) {
      console.error('Error fetching all services:', error)
    } finally {
      setLoadingAllServices(false)
    }
  }

  // Filter services based on selected filter
  const filteredServices = allServices.filter(service => {
    if (serviceFilter === 'all') return true
    if (serviceFilter === 'car') return service.category === 'CarWash'
    if (serviceFilter === 'bike') return service.category === 'BikeWash'
    return true
  })

  const markOrderDelivered = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, getFetchOptions({
        method: 'PATCH',
        body: JSON.stringify({ status: 'Completed' }),
      }))
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

  // Load service data into form for editing
  const handleEditService = async (serviceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/services/${serviceId}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        const service = data.data
        setEditingServiceId(serviceId)
        
        // Format packages: convert from API format (with perWash, discount) to form format (times, price)
        const formatPackagesForForm = (pkg) => {
          if (!pkg) return { monthly: [], quarterly: [], yearly: [] }
          
          return {
            monthly: (pkg.monthly || []).map(p => ({ times: String(p.times || ''), price: String(p.price || '') })),
            quarterly: (pkg.quarterly || []).map(p => ({ times: String(p.times || ''), price: String(p.price || '') })),
            yearly: (pkg.yearly || []).map(p => ({ times: String(p.times || ''), price: String(p.price || '') })),
          }
        }
        
        // Populate form with service data
        setFormData({
          name: service.name || '',
          description: service.description || '',
          category: service.category || 'CarWash',
          basePrice: String(service.basePrice || ''),
          duration: service.duration || '30 mins',
          image: service.image || '',
          images: (service.images || []).join(', '),
          rating: String(service.rating || 0),
          totalReviews: String(service.totalReviews || 0),
          isActive: service.isActive !== undefined ? service.isActive : true,
          packages: formatPackagesForForm(service.packages),
        })
        
        // Set selected coverage
        if (service.specifications?.coverage) {
          setSelectedCoverage(service.specifications.coverage)
        }
        
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Error loading service for edit:', error)
      setMessage({ type: 'error', text: 'Failed to load service data' })
    }
  }

  // Reset form to create new service
  const handleNewService = () => {
    setEditingServiceId(null)
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

      const url = editingServiceId 
        ? `${API_BASE_URL}/services/${editingServiceId}`
        : `${API_BASE_URL}/services`
      const method = editingServiceId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: editingServiceId ? 'Service updated successfully!' : 'Service created successfully!' 
        })
        // Reset form
        handleNewService()
        // Refresh services list
        fetchAllServices()
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || (editingServiceId ? 'Failed to update service' : 'Failed to create service')
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

        {/* Auth Token Section */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', border: '1px solid #ddd' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
            Auth Token (for protected endpoints):
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={authToken}
              onChange={(e) => {
                const token = e.target.value
                setAuthToken(token)
                localStorage.setItem('adminAuthToken', token)
              }}
              placeholder="Enter JWT token from customer app login"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            <button
              type="button"
              onClick={() => {
                setAuthToken('')
                localStorage.removeItem('adminAuthToken')
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Clear
            </button>
          </div>
          <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            Get token from customer app after logging in, or use browser dev tools to copy from network requests.
          </p>
        </div>

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
          <button
            type="button"
            className={`tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
            {(() => {
              const lowStockCount = inventory.filter(item => item.isLowStock).length
              return lowStockCount > 0 ? ` (${lowStockCount})` : ''
            })()}
          </button>
        </div>

        {/* Services Tab */}
        {activeTab === 'services' && (
          <>
            {/* Services List Section */}
            <div className="addons-list-section">
              <div className="section-header">
                <h2 className="section-title">Existing Services</h2>
                <div className="filter-tabs">
                  <button
                    type="button"
                    className={`filter-tab ${serviceFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setServiceFilter('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${serviceFilter === 'car' ? 'active' : ''}`}
                    onClick={() => setServiceFilter('car')}
                  >
                    Car Wash
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${serviceFilter === 'bike' ? 'active' : ''}`}
                    onClick={() => setServiceFilter('bike')}
                  >
                    Bike Wash
                  </button>
                </div>
              </div>

              {loadingAllServices ? (
                <div className="loading-text">Loading services...</div>
              ) : filteredServices.length === 0 ? (
                <div className="info-text">No services found for this filter.</div>
              ) : (
                <div className="addons-grid">
                  {filteredServices.map(service => (
                    <div key={service._id} className="addon-card">
                      <div className="addon-card-header">
                        <h3 className="addon-card-title">{service.name}</h3>
                        <span className={`addon-status ${service.isActive ? 'active' : 'inactive'}`}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="addon-card-details">
                        <div className="detail-item">
                          <span className="detail-label">Category:</span>
                          <span className="detail-value">
                            {service.category === 'CarWash' ? 'Car Wash' : 'Bike Wash'}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Price:</span>
                          <span className="detail-value">₹{service.basePrice}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Duration:</span>
                          <span className="detail-value">{service.duration || 'N/A'}</span>
                        </div>
                        {service.packages && (
                          <div className="detail-item">
                            <span className="detail-label">Packages:</span>
                            <span className="detail-value">
                              {[
                                service.packages.monthly?.length > 0 && `${service.packages.monthly.length} Monthly`,
                                service.packages.quarterly?.length > 0 && `${service.packages.quarterly.length} Quarterly`,
                                service.packages.yearly?.length > 0 && `${service.packages.yearly.length} Yearly`,
                              ].filter(Boolean).join(', ') || 'None'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="addon-card-footer">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleEditService(service._id)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create/Edit Service Form */}
            <div className="form-section-divider"></div>
            <div className="section-header">
              <h2 className="section-title">
                {editingServiceId ? 'Edit Service' : 'Create New Service'}
              </h2>
              {editingServiceId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleNewService}
                >
                  Create New Instead
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
                {loading 
                  ? (editingServiceId ? 'Updating...' : 'Creating...') 
                  : (editingServiceId ? 'Update Service' : 'Create Service')}
              </button>
            </form>
          </>
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
                    <div className="order-card-details">
                      <div className="detail-item">
                        <span className="detail-label">Customer:</span>
                        <span className="detail-value">{order.customer?.name || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{order.customer?.phone || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Address:</span>
                        <span className="detail-value">{order.customer?.address || '—'}</span>
                      </div>
                    </div>
                    <div className="order-card-details">
                      <div className="detail-item">
                        <span className="detail-label">Assigned Emp:</span>
                        <span className="detail-value">{order.assignedEmployeeId || '—'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Assign Status:</span>
                        <span className="detail-value">{order.assignmentStatus || '—'}</span>
                      </div>
                    </div>
                    <div className="order-slot-list">
                      <span className="detail-label">Slots:</span>
                      {(order.items || []).map((item, index) => {
                        const slotDate = item?.scheduledDate
                          ? new Date(item.scheduledDate).toLocaleDateString()
                          : '—';
                        const slotTime = item?.scheduledTimeSlot || '—';
                        const serviceName = item?.service?.name || 'Service';
                        return (
                          <div key={`${order._id}-slot-${index}`} className="order-slot-item">
                            <span className="order-slot-service">{serviceName}</span>
                            <span className="order-slot-separator">•</span>
                            <span className="order-slot-datetime">{slotDate} • {slotTime}</span>
                          </div>
                        );
                      })}
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

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="attendance-section">
            <div className="section-header">
              <h2 className="section-title">Employee Attendance</h2>
              <button
                type="button"
                className="secondary-button"
                onClick={fetchAttendance}
                disabled={loadingAttendance}
              >
                {loadingAttendance ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Date:</label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600' }}>Employee:</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minWidth: '200px',
                  }}
                >
                  <option value="all">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.employeeId || emp._id} value={emp.employeeId || emp._id}>
                      {emp.name || emp.employeeId || 'Unknown'} ({emp.employeeId || emp._id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary Cards */}
            {(() => {
              const summary = getAttendanceSummary()
              return (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '15px', 
                  marginBottom: '20px' 
                }}>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    border: '1px solid #ddd' 
                  }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Employees</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{summary.total}</div>
                  </div>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#d4edda', 
                    borderRadius: '8px', 
                    border: '1px solid #c3e6cb' 
                  }}>
                    <div style={{ fontSize: '12px', color: '#155724', marginBottom: '5px' }}>Present</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>{summary.present}</div>
                  </div>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#f8d7da', 
                    borderRadius: '8px', 
                    border: '1px solid #f5c6cb' 
                  }}>
                    <div style={{ fontSize: '12px', color: '#721c24', marginBottom: '5px' }}>Absent</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>{summary.absent}</div>
                  </div>
                </div>
              )
            })()}

            {/* Attendance Table */}
            {loadingAttendance ? (
              <div className="loading-text">Loading attendance...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  backgroundColor: '#fff', 
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Employee ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Phone</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Time</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
                          No employees found. Please ensure employees are created first.
                        </td>
                      </tr>
                    ) : employees.map((employee) => {
                      const attendanceRecord = attendance.find(a => a.employeeId === employee.employeeId)
                      return (
                        <tr key={employee.employeeId || employee._id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{employee.employeeId}</td>
                          <td style={{ padding: '12px' }}>{employee.name || '—'}</td>
                          <td style={{ padding: '12px' }}>{employee.phone || '—'}</td>
                          <td style={{ padding: '12px' }}>
                            {attendanceRecord?.checkIn ? formatTime(attendanceRecord.checkIn) : '—'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {attendanceRecord?.checkIn ? (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: '#d4edda',
                                color: '#155724',
                              }}>
                                Present
                              </span>
                            ) : (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: '#f8d7da',
                                color: '#721c24',
                              }}>
                                Absent
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="inventory-section">
            {/* Summary Cards */}
            {(() => {
              const summary = getInventorySummary()
              return (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '15px', 
                  marginBottom: '20px' 
                }}>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    border: '1px solid #ddd' 
                  }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Items</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{summary.totalItems}</div>
                  </div>
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: summary.lowStockItems > 0 ? '#fff3cd' : '#d4edda', 
                    borderRadius: '8px', 
                    border: `1px solid ${summary.lowStockItems > 0 ? '#ffc107' : '#c3e6cb'}` 
                  }}>
                    <div style={{ fontSize: '12px', color: summary.lowStockItems > 0 ? '#856404' : '#155724', marginBottom: '5px' }}>Low Stock Items</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: summary.lowStockItems > 0 ? '#856404' : '#155724' }}>{summary.lowStockItems}</div>
                  </div>
                </div>
              )
            })()}

            {/* Inventory List Section */}
            <div className="addons-list-section">
              <div className="section-header">
                <h2 className="section-title">Inventory Items</h2>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={fetchInventory}
                  disabled={loadingInventory}
                >
                  {loadingInventory ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {/* Filters */}
              <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600' }}>Category:</label>
                  <select
                    value={inventoryCategoryFilter}
                    onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="all">All Categories</option>
                    <option value="Soap">Soap</option>
                    <option value="Towels">Towels</option>
                    <option value="Polish">Polish</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600' }}>Filter:</label>
                  <select
                    value={inventoryFilter}
                    onChange={(e) => setInventoryFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="all">All Items</option>
                    <option value="lowStock">Low Stock Only</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600' }}>Search:</label>
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder="Search by name..."
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              {loadingInventory ? (
                <div className="loading-text">Loading inventory...</div>
              ) : filteredInventory.length === 0 ? (
                <div className="info-text">No inventory items found.</div>
              ) : (
                <div className="addons-grid">
                  {filteredInventory.map(item => (
                    <div 
                      key={item._id} 
                      className="addon-card"
                      style={{
                        border: item.isLowStock ? '2px solid #dc3545' : '1px solid #ddd',
                        backgroundColor: item.isLowStock ? '#fff5f5' : '#fff',
                      }}
                    >
                      <div className="addon-card-header">
                        <h3 className="addon-card-title">{item.name}</h3>
                        {item.isLowStock && (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: '#dc3545',
                            color: 'white',
                          }}>
                            LOW STOCK
                          </span>
                        )}
                      </div>
                      <div className="addon-card-details">
                        <div className="detail-item">
                          <span className="detail-label">Category:</span>
                          <span className="detail-value">{item.category}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Stock:</span>
                          <span className="detail-value" style={{ 
                            color: item.isLowStock ? '#dc3545' : '#333',
                            fontWeight: item.isLowStock ? 'bold' : 'normal'
                          }}>
                            {item.currentStock} {item.unit}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Low Stock Threshold:</span>
                          <span className="detail-value">{item.lowStockThreshold} {item.unit}</span>
                        </div>
                        {item.supplier && (
                          <div className="detail-item">
                            <span className="detail-label">Supplier:</span>
                            <span className="detail-value">{item.supplier}</span>
                          </div>
                        )}
                        {item.lastRestocked && (
                          <div className="detail-item">
                            <span className="detail-label">Last Restocked:</span>
                            <span className="detail-value">
                              {new Date(item.lastRestocked).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="addon-card-footer" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleEditInventory(item._id)}
                          style={{ flex: 1, minWidth: '80px' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setStockUpdateModal({ 
                            open: true, 
                            item, 
                            quantity: '', 
                            operation: 'add' 
                          })}
                          style={{
                            flex: 1,
                            minWidth: '80px',
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Add Stock
                        </button>
                        <button
                          type="button"
                          onClick={() => setStockUpdateModal({ 
                            open: true, 
                            item, 
                            quantity: '', 
                            operation: 'remove' 
                          })}
                          style={{
                            flex: 1,
                            minWidth: '80px',
                            padding: '8px 16px',
                            backgroundColor: '#ffc107',
                            color: '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInventory(item._id)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create/Edit Inventory Form */}
            <div className="form-section-divider"></div>
            <div className="section-header">
              <h2 className="section-title">
                {editingInventoryId ? 'Edit Inventory Item' : 'Create New Inventory Item'}
              </h2>
              {editingInventoryId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleNewInventory}
                >
                  Create New Instead
                </button>
              )}
            </div>
            <form onSubmit={handleInventorySubmit} className="form">
              <div className="form-group">
                <label htmlFor="inventory-name">Item Name *</label>
                <input
                  type="text"
                  id="inventory-name"
                  name="name"
                  value={inventoryFormData.name}
                  onChange={handleInventoryChange}
                  required
                  placeholder="e.g., Car Soap, Microfiber Towels"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="inventory-category">Category *</label>
                  <select
                    id="inventory-category"
                    name="category"
                    value={inventoryFormData.category}
                    onChange={handleInventoryChange}
                    required
                  >
                    <option value="Soap">Soap</option>
                    <option value="Towels">Towels</option>
                    <option value="Polish">Polish</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-unit">Unit *</label>
                  <input
                    type="text"
                    id="inventory-unit"
                    name="unit"
                    value={inventoryFormData.unit}
                    onChange={handleInventoryChange}
                    required
                    placeholder="e.g., liters, pieces, kg, bottles"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="inventory-stock">Current Stock *</label>
                  <input
                    type="number"
                    id="inventory-stock"
                    name="currentStock"
                    value={inventoryFormData.currentStock}
                    onChange={handleInventoryChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inventory-threshold">Low Stock Threshold *</label>
                  <input
                    type="number"
                    id="inventory-threshold"
                    name="lowStockThreshold"
                    value={inventoryFormData.lowStockThreshold}
                    onChange={handleInventoryChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="10"
                  />
                  <small className="help-text">Alert when stock falls below this amount</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="inventory-supplier">Supplier</label>
                  <input
                    type="text"
                    id="inventory-supplier"
                    name="supplier"
                    value={inventoryFormData.supplier}
                    onChange={handleInventoryChange}
                    placeholder="e.g., ABC Supplies"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="inventory-description">Description</label>
                <textarea
                  id="inventory-description"
                  name="description"
                  value={inventoryFormData.description}
                  onChange={handleInventoryChange}
                  rows="3"
                  placeholder="Additional notes about this item"
                />
              </div>

              {inventoryMessage.text && (
                <div className={`message ${inventoryMessage.type}`}>
                  {inventoryMessage.text}
                </div>
              )}

              <button type="submit" className="submit-button" disabled={loadingInventory}>
                {loadingInventory 
                  ? (editingInventoryId ? 'Updating...' : 'Creating...') 
                  : (editingInventoryId ? 'Update Item' : 'Create Item')}
              </button>
            </form>

            {/* Stock Update Modal */}
            {stockUpdateModal.open && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
              }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '30px',
                  borderRadius: '8px',
                  maxWidth: '500px',
                  width: '90%',
                }}>
                  <h2 style={{ marginBottom: '20px' }}>
                    {stockUpdateModal.operation === 'add' ? 'Add' : 'Remove'} Stock
                  </h2>
                  <p style={{ marginBottom: '15px' }}>
                    <strong>Item:</strong> {stockUpdateModal.item?.name}
                  </p>
                  <p style={{ marginBottom: '15px' }}>
                    <strong>Current Stock:</strong> {stockUpdateModal.item?.currentStock} {stockUpdateModal.item?.unit}
                  </p>
                  <div className="form-group">
                    <label>Quantity to {stockUpdateModal.operation === 'add' ? 'Add' : 'Remove'} *</label>
                    <input
                      type="number"
                      value={stockUpdateModal.quantity}
                      onChange={(e) => setStockUpdateModal(prev => ({ ...prev, quantity: e.target.value }))}
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="Enter quantity"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        marginBottom: '10px',
                      }}
                    />
                    <small className="help-text">Unit: {stockUpdateModal.item?.unit}</small>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={handleStockUpdate}
                      disabled={loadingInventory || !stockUpdateModal.quantity}
                      style={{
                        flex: 1,
                        padding: '10px 20px',
                        backgroundColor: stockUpdateModal.operation === 'add' ? '#28a745' : '#ffc107',
                        color: stockUpdateModal.operation === 'add' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loadingInventory ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      {loadingInventory ? 'Updating...' : stockUpdateModal.operation === 'add' ? 'Add Stock' : 'Remove Stock'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStockUpdateModal({ open: false, item: null, quantity: '', operation: 'add' })}
                      disabled={loadingInventory}
                      style={{
                        flex: 1,
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loadingInventory ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
